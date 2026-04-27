/**
 * @module extensions/infinite-scroll-v2/types
 *
 * public configuration + result types for the infinite-scroll-v2 ERS v2
 * extension.
 */

/**
 * reference to a fabric @server function that the extension should invoke over
 * the ERS transport. `moduleId` corresponds to the virtual module id assigned
 * by the fabric build plugin (e.g. `routes/art` for
 * `src/routes/art.fabric.tsx`).
 */
export type FunctionRef = {
  readonly moduleId: string
  readonly fn: string
}

/**
 * shape that `loadMore` server functions must return. matches the convention
 * used by the upstream core-extensions infinite-scroll so consumers can reuse
 * existing renderers unchanged.
 */
export type LoadMoreResult = {
  /** html fragment for the newly loaded items, ready to be appended */
  readonly html: string
  /** whether more items remain beyond nextOffset */
  readonly hasMore: boolean
  /** offset to pass on the next loadMore call */
  readonly nextOffset: number
  /** how many items were included in `html` */
  readonly itemCount: number
}

/**
 * client-side configuration for infinite-scroll-v2.
 *
 * @remarks
 * the warm sentinel fires once the user has scrolled past
 * `warmThresholdPercent` of the container's height, kicking off a fire-and-
 * forget `prewarm` RPC. the load sentinel fires when the viewport is within
 * `viewportOffset` px of the container's bottom, which performs the actual
 * `loadMore` RPC and appends the returned html to the container.
 */
export type InfiniteScrollClientConfig = {
  /** css selector for the container element; defaults to `[data-infinite-scroll]` */
  readonly containerSelector?: string

  /** fabric function ref used to fetch the next batch of items */
  readonly loadMore: FunctionRef

  /** fabric function ref used to warm caches ahead of the next batch */
  readonly prewarm: FunctionRef

  /** percentage of container height at which the warm sentinel sits (0-100); defaults to 50 */
  readonly warmThresholdPercent?: number

  /** distance from the container bottom (in px) at which the load sentinel sits; defaults to 200 */
  readonly viewportOffset?: number

  /** number of items per batch; falls back to the container's `data-limit` attr */
  readonly limit?: number

  /** hard cap on total items; falls back to the container's `data-max` attr */
  readonly maxItems?: number
}
