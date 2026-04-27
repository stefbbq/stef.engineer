/**
 * @module extensions/image-progressive/client
 *
 * client-side ERS v2 extension that progressively reveals images in three
 * stages:
 *   1. the server-rendered HTML paints a base64 LQIP (via the
 *      `--progressive-lqip` custom property) as a blurred backdrop, so a tile
 *      is never blank
 *   2. the inner `<img>` fetches its small thumb variant as usual
 *   3. once the thumb has loaded, this extension adds a `progressive-ready`
 *      class which the stylesheet uses to fade out the blur and fade the image
 *      in
 *
 * the extension is DOM-agnostic: any `[data-progressive-image]` element with a
 * nested `<img>` is wired. a MutationObserver catches nodes added after mount
 * (e.g. from infinite-scroll inserts).
 */

import type { ClientExtension } from '@touchlesscode/core/client'
import type { ImageProgressiveClientConfig } from './types'
import { wireTile } from './utils'

const DEFAULT_SELECTOR = '[data-progressive-image]'
const DEFAULT_READY_CLASS = 'progressive-ready'
const WIRED_ATTR = 'data-progressive-wired'

/**
 * image-progressive client extension.
 *
 * @example
 * ```ts
 * ers.extensions.register(clientExtension, {
 *   selector: '[data-progressive-image]',
 *   readyClass: 'progressive-ready',
 * })
 * ```
 */
export const clientExtension: ClientExtension<ImageProgressiveClientConfig> = {
  name: 'image-progressive',
  version: '1.0.0',

  onInit: async (ctx) => {
    const selector = ctx.config.selector ?? DEFAULT_SELECTOR
    const readyClass = ctx.config.readyClass ?? DEFAULT_READY_CLASS

    ctx.log('image-progressive initializing', { selector, readyClass })

    // list of per-tile cleanup functions, captured for onDestroy.
    const cleanups: Array<() => void> = []
    ctx.state.set('cleanups', cleanups)

    /** wire one element, guarding against double-wiring via a data-attribute marker */
    const wire = (figure: HTMLElement) => {
      if (figure.getAttribute(WIRED_ATTR) === '1') return
      figure.setAttribute(WIRED_ATTR, '1')
      cleanups.push(wireTile(figure, readyClass))
    }

    // pass 1: tiles that already exist at mount time (SSR output).
    document.querySelectorAll<HTMLElement>(selector).forEach(wire)

    // pass 2: tiles added later (infinite-scroll inserts, SPA navigations).
    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== 1) continue
          const element = node as HTMLElement
          if (element.matches?.(selector)) {
            wire(element)
            continue
          }
          element.querySelectorAll?.<HTMLElement>(selector).forEach(wire)
        }
      }
    })
    mutationObserver.observe(document.body, { childList: true, subtree: true })
    ctx.state.set('mutationObserver', mutationObserver)

    ctx.log('image-progressive initialized')
  },

  onDestroy: (ctx) => {
    const mutationObserver = ctx.state.get<MutationObserver>('mutationObserver')
    mutationObserver?.disconnect()

    const cleanups = ctx.state.get<Array<() => void>>('cleanups') ?? []
    for (const cleanup of cleanups) cleanup()

    ctx.state.clear()
    ctx.log('image-progressive destroyed')
  },
}
