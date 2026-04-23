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

const renderArtItems = (items: readonly ArtItem[]): string =>
  items.map(item => {
    const w = item.width || DEFAULT_RATIO_W
    const h = item.height || DEFAULT_RATIO_H
    const dims = item.width && item.height
      ? ` width="${item.width}" height="${item.height}"`
      : ''
    return `<figure class="art-item" style="aspect-ratio:${w}/${h}">
  <img src="${item.src}" srcset="${item.srcset}" sizes="(max-width: 520px) 100vw, (max-width: 900px) 50vw, 33vw" decoding="async"${dims} alt="" />
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

export const GET = async (_context: RouteContext) => {
  const all = await loadArt()
  const initial = all.slice(0, INITIAL_LIMIT)
  const initialHtml = renderArtItems(initial)
  const total = all.length

  const html = `
    <div class="container" style="max-width:1100px">
      <section>
        <h2>Art &amp; Design</h2>
        <p class="section-text" style="margin-bottom:1.5rem">${total} pieces. Loads more as you scroll.</p>
        <div class="art-grid" data-infinite-scroll data-limit="${INITIAL_LIMIT}" data-max="${total}">
          ${initialHtml}
        </div>
      </section>
    </div>
  `

  return { html }
}
