/**
 * @module extensions/infinite-scroll-v2/client
 *
 * ERS v2 client extension that drives infinite scrolling over the ERS
 * WebSocket (falls back to HTTP only if the socket is closed).
 *
 * @remarks
 * why this exists rather than using `@touchlesscode/core-extensions/infinite-scroll`:
 * that package (v1.1.13) bundles an older copy of `fabricCall` at
 * `dist/packages/core/src/client/fabric/utils/fabricCall.mjs` which has no
 * `rpcLoader` branch — it unconditionally posts to `/__fabric/rpc`. this v2
 * extension calls `window.ers.fabric.call(...)` instead, which is the same
 * module-local `fabricCall` the core browser bundle wires `setRpcLoader` onto,
 * so the RPC rides the WebSocket when one is open.
 *
 * the warm/load dual-sentinel mechanic is unchanged from the upstream design.
 */

import type { ClientExtension } from '@touchlesscode/core/client'
import type { InfiniteScrollClientConfig, LoadMoreResult } from './types'
import {
  callRouteFunction,
  createSentinel,
  positionLoadSentinel,
  positionWarmSentinel,
  shouldLoadMore,
  shouldPrewarm,
} from './utils'

const DEFAULT_CONTAINER_SELECTOR = '[data-infinite-scroll]'
const DEFAULT_WARM_THRESHOLD_PERCENT = 50
const DEFAULT_VIEWPORT_OFFSET = 200
const DEFAULT_LIMIT = 12
const DEFAULT_MAX_ITEMS = 1000

/**
 * infinite-scroll-v2 client extension. drop-in config shape with the upstream
 * `@touchlesscode/core-extensions/infinite-scroll` so switching is a one-line
 * import change at the registration site.
 *
 * @example
 * ```ts
 * ers.extensions.register(clientExtension, {
 *   containerSelector: '[data-infinite-scroll]',
 *   loadMore: { moduleId: 'routes/art', fn: 'loadArtPage' },
 *   prewarm: { moduleId: 'routes/art', fn: 'prewarmArtPage' },
 *   warmThresholdPercent: 50,
 *   viewportOffset: 200,
 * })
 * ```
 */
export const clientExtension: ClientExtension<InfiniteScrollClientConfig> = {
  name: 'infinite-scroll-v2',
  version: '1.0.0',

  onInit: async (ctx) => {
    const containerSelector = ctx.config.containerSelector ?? DEFAULT_CONTAINER_SELECTOR
    const warmThresholdPercent = ctx.config.warmThresholdPercent ?? DEFAULT_WARM_THRESHOLD_PERCENT
    const viewportOffset = ctx.config.viewportOffset ?? DEFAULT_VIEWPORT_OFFSET

    const container = document.querySelector(containerSelector) as HTMLElement | null
    if (!container) {
      ctx.log('container not found', { selector: containerSelector })
      return
    }

    // sentinels are absolutely positioned, so make sure the container is their
    // containing block.
    if (window.getComputedStyle(container).position === 'static') {
      container.style.setProperty('position', 'relative')
    }

    const limit = ctx.config.limit ?? (Number(container.dataset.limit) || DEFAULT_LIMIT)
    const maxItems = ctx.config.maxItems ?? (Number(container.dataset.max) || DEFAULT_MAX_ITEMS)

    // initial state — the first batch is assumed to already be SSR'd into the
    // container, so we start at `offset = limit`.
    ctx.state.set('offset', limit)
    ctx.state.set('hasMore', true)
    ctx.state.set('isLoading', false)
    ctx.state.set('isPrewarming', false)
    ctx.state.set('prewarmedOffset', 0)
    ctx.state.set('limit', limit)
    ctx.state.set('maxItems', maxItems)

    ctx.log('infinite-scroll-v2 initializing', {
      container: containerSelector,
      warmThreshold: `${warmThresholdPercent}%`,
      viewportOffset: `${viewportOffset}px`,
      limit,
      maxItems,
    })

    const warmSentinel = createSentinel('warm')
    const loadSentinel = createSentinel('load')
    positionWarmSentinel(warmSentinel, container, warmThresholdPercent)
    positionLoadSentinel(loadSentinel, container, viewportOffset)
    container.appendChild(warmSentinel)
    container.appendChild(loadSentinel)
    ctx.state.set('warmSentinel', warmSentinel)
    ctx.state.set('loadSentinel', loadSentinel)
    ctx.state.set('container', container)

    /** fire-and-forget prewarm — kicks a cache-warming server call without blocking UI */
    const handleWarm = () => {
      const currentOffset = ctx.state.get<number>('offset') ?? 0
      const prewarmedOffset = ctx.state.get<number>('prewarmedOffset') ?? 0
      const currentLimit = ctx.state.get<number>('limit') ?? limit
      const hasMore = ctx.state.get<boolean>('hasMore') ?? false
      const isPrewarming = ctx.state.get<boolean>('isPrewarming') ?? false

      if (!shouldPrewarm({ isPrewarming, hasMore, prewarmedOffset, currentOffset })) return

      ctx.state.set('isPrewarming', true)
      const offsetAtCall = currentOffset
      ctx.log('prewarming', { offset: offsetAtCall, limit: currentLimit })

      callRouteFunction<LoadMoreResult>(ctx.config.prewarm, offsetAtCall, currentLimit)
        .then(() => {
          ctx.log('prewarm complete', { offset: offsetAtCall })
          ctx.state.set('prewarmedOffset', offsetAtCall + currentLimit)
        })
        .catch((error) => {
          const message = error instanceof Error ? error.message : String(error)
          const stack = error instanceof Error ? error.stack : undefined
          ctx.log(`prewarm failed: ${message}`, { stack })
        })
        .finally(() => {
          ctx.state.set('isPrewarming', false)
        })
    }

    /** load-more — fetches the next batch, appends its html, repositions sentinels */
    const handleLoad = async () => {
      const isLoading = ctx.state.get<boolean>('isLoading') ?? false
      const hasMore = ctx.state.get<boolean>('hasMore') ?? false

      if (!shouldLoadMore({ isLoading, hasMore })) return

      ctx.state.set('isLoading', true)
      const currentOffset = ctx.state.get<number>('offset') ?? 0
      const currentLimit = ctx.state.get<number>('limit') ?? limit
      const currentMaxItems = ctx.state.get<number>('maxItems') ?? maxItems

      ctx.log('loading', { offset: currentOffset, limit: currentLimit })

      try {
        const result = await callRouteFunction<LoadMoreResult>(ctx.config.loadMore, currentOffset, currentLimit)

        ctx.log('loaded', {
          count: result.itemCount,
          hasMore: result.hasMore,
          nextOffset: result.nextOffset,
        })

        // inserting before the warm sentinel keeps both sentinels below the
        // newest items — essential for re-observation to fire on next scroll.
        const currentContainer = ctx.state.get<HTMLElement>('container')
        const currentWarmSentinel = ctx.state.get<HTMLElement>('warmSentinel')
        if (currentContainer && currentWarmSentinel && result.html) {
          const fragment = document.createRange().createContextualFragment(result.html)
          while (fragment.firstChild) {
            currentContainer.insertBefore(fragment.firstChild, currentWarmSentinel)
          }
        }

        ctx.state.set('offset', result.nextOffset)
        const reachedMax = result.nextOffset >= currentMaxItems
        ctx.state.set('hasMore', result.hasMore && !reachedMax)

        if (currentContainer && currentWarmSentinel) {
          positionWarmSentinel(currentWarmSentinel, currentContainer, warmThresholdPercent)
        }
        const currentLoadSentinel = ctx.state.get<HTMLElement>('loadSentinel')
        if (currentContainer && currentLoadSentinel) {
          positionLoadSentinel(currentLoadSentinel, currentContainer, viewportOffset)
        }

        // hydrate any ERS-managed modules in the newly inserted fragment.
        if (currentContainer && ctx.dom?.hydrate) {
          await ctx.dom.hydrate(currentContainer)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        const stack = error instanceof Error ? error.stack : undefined
        ctx.log(`load failed: ${message}`, { stack })
      } finally {
        ctx.state.set('isLoading', false)
      }
    }

    const warmObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) handleWarm()
      },
      { rootMargin: '0px', threshold: 0 },
    )

    const loadObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) handleLoad()
      },
      { rootMargin: `${viewportOffset}px 0px 0px 0px`, threshold: 0 },
    )

    warmObserver.observe(warmSentinel)
    loadObserver.observe(loadSentinel)
    ctx.state.set('warmObserver', warmObserver)
    ctx.state.set('loadObserver', loadObserver)

    ctx.log('infinite-scroll-v2 initialized')
  },

  onDestroy: (ctx) => {
    const warmObserver = ctx.state.get<IntersectionObserver>('warmObserver')
    const loadObserver = ctx.state.get<IntersectionObserver>('loadObserver')
    warmObserver?.disconnect()
    loadObserver?.disconnect()

    const warmSentinel = ctx.state.get<HTMLElement>('warmSentinel')
    const loadSentinel = ctx.state.get<HTMLElement>('loadSentinel')
    warmSentinel?.parentNode?.removeChild(warmSentinel)
    loadSentinel?.parentNode?.removeChild(loadSentinel)

    ctx.state.clear()
    ctx.log('infinite-scroll-v2 destroyed')
  },
}
