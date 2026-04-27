/**
 * @module extensions/image-progressive/types
 *
 * public configuration types for the image-progressive ERS v2 extension.
 */

/**
 * client-side configuration for the image-progressive extension.
 *
 * @remarks
 * the extension scans for elements matching `selector`, paints an inline
 * low-quality placeholder (via CSS custom property `--progressive-lqip` emitted
 * server-side), and toggles a `progressive-ready` class on each tile once its
 * inner `<img>` has loaded, which the CSS uses to fade out the blur and fade
 * in the image.
 */
export type ImageProgressiveClientConfig = {
  /**
   * css selector identifying tiles to wire. defaults to
   * `[data-progressive-image]`.
   */
  readonly selector?: string

  /**
   * class added to each tile once its `<img>` has loaded (or errored). the
   * stylesheet drives the blur-out + fade-in transition from this class.
   * defaults to `progressive-ready`.
   */
  readonly readyClass?: string
}
