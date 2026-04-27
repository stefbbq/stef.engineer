import type { ArtItem } from '../types'
import { getData } from '../data/kv'

type RouteContext = { request: Request; params: Record<string, string>; query: URLSearchParams; env: unknown }

const INITIAL_LIMIT = 12

/**
 * default aspect ratio (4:3) for items without measured dimensions.
 * setting aspect-ratio inline lets the browser reserve correct space
 * before the image loads, which avoids the "extra blank page" effect
 * caused by lazy-loaded images sitting at the default JS span estimate.
 */
const DEFAULT_RATIO_W = 4
const DEFAULT_RATIO_H = 3

/**
 * pick the smallest variant from a srcset so the default thumb src is the
 * low-res version. this is the only src we emit on the grid <img>; srcset and
 * sizes are deliberately omitted so the browser can't upgrade to the 1920w
 * file (the lightbox does that upgrade on open from the inline manifest JSON).
 */
const pickSmallestSrc = (srcset: string, fallback: string): string => {
  const entries = srcset
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const [url, descriptor = ''] = part.split(/\s+/)
      const width = parseInt(descriptor.replace(/\D/g, ''), 10)
      return { url, width: Number.isFinite(width) ? width : Number.POSITIVE_INFINITY }
    })
  if (entries.length === 0) return fallback
  const smallest = entries.reduce((a, b) => (a.width <= b.width ? a : b))
  return smallest.url || fallback
}

/**
 * escape a value so it's safe to inline inside an HTML attribute double-quoted
 * context. base64 data URIs themselves never contain `"`, but we still guard
 * against it + the common css break-outs to keep this honest if the seed
 * format ever changes.
 */
const escapeAttribute = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')

const renderArtItems = (items: readonly ArtItem[]): string =>
  items.map(item => {
    const width = item.width || DEFAULT_RATIO_W
    const height = item.height || DEFAULT_RATIO_H
    const dims = item.width && item.height
      ? ` width="${item.width}" height="${item.height}"`
      : ''
    const thumbSrc = pickSmallestSrc(item.srcset, item.src)
    // stage-1 LQIP: emit the base64 placeholder as a CSS custom property in
    // the inline style so the blurred backdrop paints from the very first
    // paint, before any javascript has run.
    const style = item.placeholder
      ? `aspect-ratio:${width}/${height};--progressive-lqip:url('${escapeAttribute(item.placeholder)}')`
      : `aspect-ratio:${width}/${height}`
    return `<figure class="art-item" data-id="${item.id}" data-progressive-image style="${style}">
  <img src="${thumbSrc}" decoding="async" loading="lazy"${dims} alt="" />
</figure>`
  }).join('')

const loadArt = async (): Promise<readonly ArtItem[]> => {
  const items = await getData<readonly ArtItem[]>(null, 'art')
  return items ?? []
}

/** @server */
export async function loadArtPage(_context: RouteContext, offset: number, limit: number) {
  const all = await loadArt()
  const slice = all.slice(offset, offset + limit)
  const html = renderArtItems(slice)
  const nextOffset = offset + slice.length
  return {
    html,
    hasMore: nextOffset < all.length,
    nextOffset,
    itemCount: slice.length,
  }
}

/** @server */
export async function prewarmArtPage(_context: RouteContext, offset: number, limit: number) {
  const all = await loadArt()
  const slice = all.slice(offset, offset + limit)
  const nextOffset = offset + slice.length
  return {
    html: '',
    hasMore: nextOffset < all.length,
    nextOffset,
    itemCount: slice.length,
  }
}

/** escape a json string so it can't break out of a <script> tag */
const escapeInlineJson = (json: string): string =>
  json.replace(/</g, '\\u003c').replace(/-->/g, '--\\u003e')

export const GET = async (_context: RouteContext) => {
  const all = await loadArt()
  const initial = all.slice(0, INITIAL_LIMIT)
  const initialHtml = renderArtItems(initial)
  const total = all.length
  const manifestJson = escapeInlineJson(JSON.stringify(all))

  const html = `
    <div class="container" style="max-width:1100px">
      <section>
        <h2>Art &amp; Design</h2>
        <p class="section-text" style="margin-bottom:1.5rem">${total} pieces. Loads more as you scroll.</p>
        <div class="art-grid" data-infinite-scroll data-limit="${INITIAL_LIMIT}" data-max="${total}">
          ${initialHtml}
        </div>
        <script type="application/json" id="art-manifest">${manifestJson}</script>
      </section>
    </div>
  `

  return { html }
}
