/**
 * pinterest-style masonry layout for the art grid.
 *
 * uses CSS Grid with very small `grid-auto-rows` (8px). every `.art-item`
 * gets `grid-row: span N` based on its rendered aspect ratio. items stay in
 * source order so newly inserted items (from infinite scroll) appear at the
 * bottom.
 *
 * the server sets `aspect-ratio: W/H` inline on every item, so we can compute
 * a correct span without waiting for the image to load. when the image
 * eventually loads, we refine the span from its natural dimensions.
 *
 * watches for items added to the grid via MutationObserver and computes spans
 * on insertion. recalculates on window resize.
 */

declare const window: any
declare const document: any

const ROW_HEIGHT = 8
const ROW_GAP = 16
const DEFAULT_SPAN = 30

const parseAspectRatio = (item: HTMLElement): number => {
  const ar = item.style.aspectRatio
  if (!ar) return 0
  const parts = ar.split('/').map(s => parseFloat(s.trim()))
  if (parts.length === 2 && parts[0] && parts[1]) return parts[0] / parts[1]
  const single = parseFloat(ar)
  return Number.isFinite(single) && single > 0 ? single : 0
}

const computeSpan = (item: HTMLElement): number => {
  let aspectRatio = parseAspectRatio(item)

  // refine with actual image dimensions when available
  const img = item.querySelector('img') as HTMLImageElement | null
  if (img && img.naturalWidth && img.naturalHeight) {
    aspectRatio = img.naturalWidth / img.naturalHeight
  }

  const itemWidth = item.clientWidth
  if (itemWidth === 0 || aspectRatio === 0) return DEFAULT_SPAN

  const itemHeight = itemWidth / aspectRatio
  return Math.max(1, Math.ceil((itemHeight + ROW_GAP) / (ROW_HEIGHT + ROW_GAP)))
}

const applySpan = (item: HTMLElement) => {
  const span = computeSpan(item)
  item.style.gridRowEnd = `span ${span}`
}

const setupItem = (item: HTMLElement) => {
  // initial span from server-provided aspect-ratio (instant, no image needed)
  applySpan(item)

  // refine once the image has loaded
  const img = item.querySelector('img') as HTMLImageElement | null
  if (!img) return
  if (img.complete && img.naturalWidth > 0) return
  img.addEventListener('load', () => applySpan(item), { once: true })
  img.addEventListener('error', () => applySpan(item), { once: true })
}

const setupAllItems = () => {
  document.querySelectorAll('.art-item').forEach((item: Element) => {
    setupItem(item as HTMLElement)
  })
}

let mutationObserver: MutationObserver | null = null
let resizeTimer: ReturnType<typeof setTimeout> | null = null
let installed = false

const observeGrid = (grid: HTMLElement) => {
  if (mutationObserver) mutationObserver.disconnect()
  mutationObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return
        const element = node as HTMLElement
        if (element.classList?.contains('art-item')) {
          setupItem(element)
          return
        }
        element.querySelectorAll?.('.art-item').forEach((nested) => {
          setupItem(nested as HTMLElement)
        })
      })
    }
  })
  mutationObserver.observe(grid, { childList: true, subtree: false })
}

/** call when a page is mounted that contains an art grid; idempotent per grid */
export const ensureArtGrid = () => {
  const grid = document.querySelector('.art-grid') as HTMLElement | null
  if (!grid) {
    if (mutationObserver) {
      mutationObserver.disconnect()
      mutationObserver = null
    }
    return
  }
  if (grid.getAttribute('data-art-grid-attached') === '1') {
    setupAllItems()
    return
  }
  setupAllItems()
  observeGrid(grid)
  grid.setAttribute('data-art-grid-attached', '1')
}

/** install one-time global listeners (resize) */
export const installArtGrid = () => {
  if (installed) return
  installed = true
  window.addEventListener('resize', () => {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(setupAllItems, 150)
  })
}
