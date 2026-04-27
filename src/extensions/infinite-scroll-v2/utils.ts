/**
 * @module extensions/infinite-scroll-v2/utils
 *
 * pure helpers for infinite-scroll-v2 — sentinel construction, positioning,
 * gating predicates, and the WS-aware RPC helper used to call route-level
 * fabric functions.
 */

import type { FunctionRef } from './types'

/**
 * shape of `window.ers.fabric` that we rely on. the browser bundle wires
 * `setRpcLoader($.rpc)` in the same module scope as `createFabric()`, then
 * attaches the result at `window.ers` — so `window.ers.fabric.call` goes
 * through the rpcLoader-backed transport and, in hybrid mode with an open
 * socket, rides the WebSocket.
 */
type ErsFabricGlobal = {
  readonly fabric: {
    readonly call: <T>(moduleId: string, fn: string, args: readonly unknown[]) => Promise<T>
  }
}

/**
 * invoke a fabric @server function by `{ moduleId, fn }` ref, routing through
 * the ERS v2 client's rpcLoader — which uses WebSocket transport when a hybrid
 * socket is open and falls back to HTTP otherwise. equivalent to the
 * upstream extension's `fabricCall(moduleId, fn, args)` except here we reach
 * for the global so we don't inherit an older bundled copy that has no
 * rpcLoader branch.
 *
 * @param ref - target function ref
 * @param args - arguments passed as a tuple to the server function
 */
export const callRouteFunction = async <T>(
  ref: FunctionRef,
  ...args: readonly unknown[]
): Promise<T> => {
  const ers = (window as unknown as { readonly ers?: ErsFabricGlobal }).ers
  if (!ers?.fabric?.call) {
    throw new Error('infinite-scroll-v2: window.ers.fabric.call unavailable')
  }
  return ers.fabric.call<T>(ref.moduleId, ref.fn, args)
}

/**
 * build a sentinel div — an invisible, full-width 1px-tall absolutely-
 * positioned element that we observe via IntersectionObserver to drive the
 * prewarm / load lifecycle.
 */
export const createSentinel = (role: 'warm' | 'load'): HTMLDivElement => {
  const sentinel = document.createElement('div')
  sentinel.setAttribute('data-infinite-scroll-sentinel', role)
  sentinel.style.setProperty('position', 'absolute')
  sentinel.style.setProperty('left', '0')
  sentinel.style.setProperty('width', '100%')
  sentinel.style.setProperty('height', '1px')
  sentinel.style.setProperty('pointer-events', 'none')
  return sentinel
}

/**
 * position the warm sentinel at `percent` of the container's scroll height.
 */
export const positionWarmSentinel = (sentinel: HTMLElement, container: HTMLElement, percent: number): void => {
  const top = Math.floor(container.scrollHeight * (percent / 100))
  sentinel.style.setProperty('top', `${top}px`)
}

/**
 * position the load sentinel `offset` px above the container's bottom.
 */
export const positionLoadSentinel = (sentinel: HTMLElement, container: HTMLElement, offset: number): void => {
  const top = Math.max(0, container.scrollHeight - offset)
  sentinel.style.setProperty('top', `${top}px`)
}

/**
 * gate predicate for whether a load-more call should fire.
 */
export const shouldLoadMore = (state: { readonly isLoading: boolean; readonly hasMore: boolean }): boolean =>
  !state.isLoading && state.hasMore

/**
 * gate predicate for whether a prewarm call should fire — only if we aren't
 * already prewarming, there's more to load, and we haven't already prewarmed
 * past the current offset.
 */
export const shouldPrewarm = (state: {
  readonly isPrewarming: boolean
  readonly hasMore: boolean
  readonly prewarmedOffset: number
  readonly currentOffset: number
}): boolean => !state.isPrewarming && state.hasMore && state.prewarmedOffset <= state.currentOffset
