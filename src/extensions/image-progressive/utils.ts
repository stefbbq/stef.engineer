/**
 * @module extensions/image-progressive/utils
 *
 * pure helpers for wiring up individual progressive-image tiles.
 */

/**
 * mark a tile as ready — CSS will react by fading the blur layer out and the
 * thumbnail in.
 *
 * @param figure - the tile element (usually a `<figure>`)
 * @param readyClass - class name to add
 */
export const markTileReady = (figure: HTMLElement, readyClass: string): void => {
  figure.classList.add(readyClass)
}

/**
 * wire a single progressive-image tile. if the inner `<img>` is already loaded
 * (cached), flip to ready immediately. otherwise attach one-shot listeners for
 * load + error that flip the tile in either case (errors should still unblock
 * the ui).
 *
 * @param figure - the tile element to wire
 * @param readyClass - class name to add once loaded
 * @returns cleanup function that detaches any attached listeners
 */
export const wireTile = (figure: HTMLElement, readyClass: string): (() => void) => {
  const image = figure.querySelector('img') as HTMLImageElement | null
  if (!image) return () => {}

  if (image.complete && image.naturalWidth > 0) {
    markTileReady(figure, readyClass)
    return () => {}
  }

  const handleLoad = () => markTileReady(figure, readyClass)
  const handleError = () => markTileReady(figure, readyClass)
  image.addEventListener('load', handleLoad, { once: true })
  image.addEventListener('error', handleError, { once: true })

  return () => {
    image.removeEventListener('load', handleLoad)
    image.removeEventListener('error', handleError)
  }
}
