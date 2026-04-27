/**
 * @module extensions/infinite-scroll-v2
 *
 * ERS v2 client extension for dual-sentinel infinite scroll that routes its
 * RPC over the ERS WebSocket transport. drop-in replacement for
 * `@touchlesscode/core-extensions/infinite-scroll` with an identical config
 * shape.
 *
 * @example
 * ```ts
 * import { clientExtension as infiniteScroll } from './extensions/infinite-scroll-v2'
 *
 * ers.extensions.register(infiniteScroll, {
 *   containerSelector: '[data-infinite-scroll]',
 *   loadMore: { moduleId: 'routes/art', fn: 'loadArtPage' },
 *   prewarm: { moduleId: 'routes/art', fn: 'prewarmArtPage' },
 * })
 * ```
 */

export { clientExtension } from './client'
export type { FunctionRef, InfiniteScrollClientConfig, LoadMoreResult } from './types'
