/**
 * @module extensions/image-progressive
 *
 * ERS v2 client extension that adds three-stage progressive image loading
 * (SSR-painted LQIP blur -> thumb fetched -> fade-in on load) to any tile
 * marked with `[data-progressive-image]`.
 *
 * @example
 * ```ts
 * import { clientExtension as imageProgressive } from './extensions/image-progressive'
 * ers.extensions.register(imageProgressive, { selector: '[data-progressive-image]' })
 * ```
 */

export { clientExtension } from './client'
export type { ImageProgressiveClientConfig } from './types'
