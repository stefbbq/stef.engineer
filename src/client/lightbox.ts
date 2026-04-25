/**
 * art gallery lightbox with deep linking.
 *
 * normal flow:
 * - tap thumbnail → clone animates from its current position to fit-to-viewport (FLIP)
 * - left/right arrows + buttons swap to neighbouring images
 * - esc, backdrop click, or close button dismisses (animates back to source if visible)
 * - closes automatically on SPA pathname change
 *
 * deep linking:
 * - /art?id=<uuid> opens the matching image on page load (fade-in)
 * - opening a thumb pushes ?id=<uuid>
 * - prev/next replaces the query in place
 * - close strips the query (replaces, so back returns to pre-lightbox state)
 * - popstate reconciles lightbox state with the URL (back/forward support)
 *
 * uses FLIP-style animation when a source thumb is visible (capture source rect,
 * position absolutely, then transition to target rect). when deep-linking to an
 * image whose thumb isn't yet loaded, opens with a plain centered fade-in.
 */

declare const window: any
declare const document: any
declare const requestAnimationFrame: (cb: FrameRequestCallback) => number

const ANIM_MS = 380
const ART_PATH = '/art'

type ArtItem = {
  readonly id: string
  readonly src: string
  readonly srcset?: string
  readonly width?: number
  readonly height?: number
}

type State = {
  isOpen: boolean
  isAnimating: boolean
  currentIndex: number
  items: HTMLImageElement[]
  manifest: ArtItem[]
  overlay: HTMLDivElement | null
  clone: HTMLImageElement | null
  source: HTMLImageElement | null
}

const state: State = {
  isOpen: false,
  isAnimating: false,
  currentIndex: 0,
  items: [],
  manifest: [],
  overlay: null,
  clone: null,
  source: null,
}

// capture native history methods at module load so our URL writes bypass
// any monkey-patched versions that may dismiss us on pushState/replaceState
const nativePushState = window.history.pushState.bind(window.history)
const nativeReplaceState = window.history.replaceState.bind(window.history)

/** parses ?id=... from the current URL; returns null if absent */
const readIdFromUrl = (): string | null => {
  try {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    return id && id.length > 0 ? id : null
  } catch (_error) {
    return null
  }
}

/** push/replace ?id=... on the current /art url without touching pathname */
const writeIdToUrl = (id: string | null, mode: 'push' | 'replace') => {
  if (window.location.pathname !== ART_PATH) return
  const params = new URLSearchParams(window.location.search)
  if (id) params.set('id', id)
  else params.delete('id')
  const query = params.toString()
  const next = query.length > 0 ? `${ART_PATH}?${query}` : ART_PATH
  const history = window.history
  const writer = mode === 'push' ? nativePushState : nativeReplaceState
  writer(history.state, '', next)
}

/** parses the inlined #art-manifest script; empty array if absent or malformed */
const readManifest = (): ArtItem[] => {
  const element = document.getElementById('art-manifest')
  if (!element) return []
  try {
    const parsed = JSON.parse(element.textContent || '[]')
    return Array.isArray(parsed) ? (parsed as ArtItem[]) : []
  } catch (_error) {
    return []
  }
}

/** refresh the live DOM thumb list; used for FLIP source lookup + nav */
const refreshItems = () => {
  state.items = Array.from(document.querySelectorAll('.art-item img')) as HTMLImageElement[]
}

/** find the DOM thumb for a given art id, if it's currently rendered */
const findThumbById = (id: string): HTMLImageElement | null => {
  const figure = document.querySelector(`.art-item[data-id="${CSS.escape(id)}"]`) as HTMLElement | null
  if (!figure) return null
  return figure.querySelector('img') as HTMLImageElement | null
}

const computeFitRect = (naturalWidth: number, naturalHeight: number) => {
  const maxWidth = window.innerWidth * 0.92
  const maxHeight = window.innerHeight * 0.92
  const safeWidth = naturalWidth || 1600
  const safeHeight = naturalHeight || 1200
  const ratio = safeWidth / safeHeight
  let width = maxWidth
  let height = width / ratio
  if (height > maxHeight) {
    height = maxHeight
    width = height * ratio
  }
  return {
    left: (window.innerWidth - width) / 2,
    top: (window.innerHeight - height) / 2,
    width,
    height,
  }
}

const applyRect = (
  element: HTMLElement,
  rect: { left: number; top: number; width: number; height: number },
) => {
  element.style.left = `${rect.left}px`
  element.style.top = `${rect.top}px`
  element.style.width = `${rect.width}px`
  element.style.height = `${rect.height}px`
}

const buildOverlay = (): HTMLDivElement => {
  const overlay = document.createElement('div')
  overlay.className = 'lightbox'

  const closeBtn = document.createElement('button')
  closeBtn.className = 'lightbox-btn lightbox-close'
  closeBtn.setAttribute('aria-label', 'Close')
  closeBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`

  const prevBtn = document.createElement('button')
  prevBtn.className = 'lightbox-btn lightbox-prev'
  prevBtn.setAttribute('aria-label', 'Previous')
  prevBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`

  const nextBtn = document.createElement('button')
  nextBtn.className = 'lightbox-btn lightbox-next'
  nextBtn.setAttribute('aria-label', 'Next')
  nextBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`

  overlay.appendChild(closeBtn)
  overlay.appendChild(prevBtn)
  overlay.appendChild(nextBtn)

  closeBtn.addEventListener('click', (event: MouseEvent) => {
    event.stopPropagation()
    close({ writeUrl: true })
  })
  prevBtn.addEventListener('click', (event: MouseEvent) => {
    event.stopPropagation()
    navigate(-1, { writeUrl: true })
  })
  nextBtn.addEventListener('click', (event: MouseEvent) => {
    event.stopPropagation()
    navigate(1, { writeUrl: true })
  })
  overlay.addEventListener('click', (event: MouseEvent) => {
    if (event.target === overlay || event.target === state.clone) close({ writeUrl: true })
  })

  return overlay
}

type OpenOptions = {
  readonly source?: HTMLImageElement | null
  readonly animate: 'flip' | 'fade'
  readonly writeUrl: boolean
}

/** opens the lightbox on a manifest index, FLIP-ing from source if given */
const open = (index: number, options: OpenOptions) => {
  if (state.isAnimating) return
  if (index < 0 || index >= state.manifest.length) return

  const item = state.manifest[index]
  state.isOpen = true
  state.isAnimating = true
  state.currentIndex = index
  state.source = options.source ?? null

  state.overlay = buildOverlay()
  state.clone = document.createElement('img')
  state.clone.className = 'lightbox-image'
  state.clone.alt = state.source?.alt || ''
  // start the clone with the already-decoded thumb for instant FLIP, then
  // deterministically upgrade to the full-res (_1920) variant below.
  state.clone.src = state.source?.currentSrc || state.source?.src || item.src
  state.clone.style.position = 'fixed'
  state.clone.removeAttribute('srcset')
  if (state.clone.src !== item.src) {
    const upgrade = new Image()
    upgrade.onload = () => {
      if (state.clone && state.manifest[state.currentIndex]?.id === item.id) {
        state.clone.src = item.src
      }
    }
    upgrade.src = item.src
  }

  if (options.animate === 'flip' && state.source) {
    applyRect(state.clone, state.source.getBoundingClientRect())
  } else {
    // fade-in: place at the target fit-rect immediately, fade opacity
    const target = computeFitRect(item.width ?? 1600, item.height ?? 1200)
    applyRect(state.clone, target)
    state.clone.classList.add('fade-in')
  }

  state.overlay.appendChild(state.clone)
  document.body.appendChild(state.overlay)
  document.body.classList.add('lightbox-open')

  if (state.source) state.source.style.visibility = 'hidden'

  requestAnimationFrame(() => {
    state.overlay?.classList.add('open')
    if (!state.clone) return
    if (options.animate === 'flip' && state.source) {
      const naturalWidth = state.clone.naturalWidth || state.source.naturalWidth || item.width || 1600
      const naturalHeight = state.clone.naturalHeight || state.source.naturalHeight || item.height || 1200
      const target = computeFitRect(naturalWidth, naturalHeight)
      applyRect(state.clone, target)
    }
  })

  setTimeout(() => {
    state.isAnimating = false
    state.clone?.classList.remove('fade-in')
  }, ANIM_MS)

  if (options.writeUrl) writeIdToUrl(item.id, 'push')
}

type CloseOptions = {
  readonly writeUrl: boolean
}

const close = (options: CloseOptions) => {
  if (!state.isOpen || state.isAnimating || !state.overlay || !state.clone) return
  state.isAnimating = true
  state.isOpen = false

  if (state.source) {
    // FLIP back to visible thumb
    const sourceRect = state.source.getBoundingClientRect()
    applyRect(state.clone, sourceRect)
  } else {
    // no visible thumb: fade out in place
    state.clone.style.transition = 'opacity .3s ease'
    state.clone.style.opacity = '0'
  }
  state.overlay.classList.remove('open')

  setTimeout(() => {
    if (state.source) state.source.style.visibility = ''
    state.overlay?.remove()
    document.body.classList.remove('lightbox-open')
    state.overlay = null
    state.clone = null
    state.source = null
    state.isAnimating = false
  }, ANIM_MS)

  if (options.writeUrl) writeIdToUrl(null, 'replace')
}

type NavigateOptions = {
  readonly writeUrl: boolean
}

const navigate = (delta: number, options: NavigateOptions) => {
  if (!state.isOpen || state.isAnimating || !state.clone) return
  if (state.manifest.length < 2) return

  const nextIndex = (state.currentIndex + delta + state.manifest.length) % state.manifest.length
  if (nextIndex === state.currentIndex) return

  const nextItem = state.manifest[nextIndex]

  // un-ghost previous source; resolve new source (may be null if unloaded)
  if (state.source) state.source.style.visibility = ''
  state.currentIndex = nextIndex
  refreshItems()
  state.source = findThumbById(nextItem.id)
  if (state.source) state.source.style.visibility = 'hidden'

  // prefer the neighbour thumb's already-decoded small image for the instant
  // swap, then upgrade to the full-res (_1920) variant once it's decoded.
  const thumbSrc = state.source?.currentSrc || state.source?.src || nextItem.src
  state.clone.classList.add('swapping')

  const swap = () => {
    if (!state.clone) return
    state.clone.removeAttribute('srcset')
    state.clone.src = thumbSrc
    const handleLoad = () => {
      if (!state.clone) return
      const naturalWidth = state.clone.naturalWidth || nextItem.width || 1600
      const naturalHeight = state.clone.naturalHeight || nextItem.height || 1200
      const target = computeFitRect(naturalWidth, naturalHeight)
      applyRect(state.clone, target)
      state.clone.classList.remove('swapping')
    }
    if (state.clone.complete && state.clone.naturalWidth > 0) handleLoad()
    else state.clone.addEventListener('load', handleLoad, { once: true })

    if (thumbSrc !== nextItem.src) {
      const upgrade = new Image()
      upgrade.onload = () => {
        if (state.clone && state.manifest[state.currentIndex]?.id === nextItem.id) {
          state.clone.src = nextItem.src
        }
      }
      upgrade.src = nextItem.src
    }
  }

  // small delay so the fade-out of the old image is visible
  setTimeout(swap, 80)

  if (options.writeUrl) writeIdToUrl(nextItem.id, 'replace')
}

const handleClick = (event: MouseEvent) => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
  if (state.isOpen) return

  const target = event.target as HTMLElement
  const figure = target.closest('.art-item') as HTMLElement | null
  if (!figure) return
  const id = figure.getAttribute('data-id')
  if (!id) return
  const img = figure.querySelector('img') as HTMLImageElement | null
  if (!img) return

  if (state.manifest.length === 0) state.manifest = readManifest()
  const index = state.manifest.findIndex(item => item.id === id)
  if (index < 0) return

  event.preventDefault()
  open(index, { source: img, animate: 'flip', writeUrl: true })
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!state.isOpen) return
  if (event.key === 'Escape') {
    event.preventDefault()
    close({ writeUrl: true })
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    navigate(-1, { writeUrl: true })
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    navigate(1, { writeUrl: true })
  }
}

const handleResize = () => {
  if (!state.isOpen || !state.clone) return
  const item = state.manifest[state.currentIndex]
  const naturalWidth = state.clone.naturalWidth || item?.width || 1600
  const naturalHeight = state.clone.naturalHeight || item?.height || 1200
  const target = computeFitRect(naturalWidth, naturalHeight)
  applyRect(state.clone, target)
}

/**
 * reconcile lightbox state with the current URL. used for browser back/forward
 * and for initial page load. never writes to the URL itself.
 */
const reconcileWithUrl = () => {
  if (window.location.pathname !== ART_PATH) return
  if (state.manifest.length === 0) state.manifest = readManifest()

  const id = readIdFromUrl()
  if (!id) {
    if (state.isOpen) close({ writeUrl: false })
    return
  }

  const index = state.manifest.findIndex(item => item.id === id)
  if (index < 0) {
    // unknown id — clean it off the URL and bail
    writeIdToUrl(null, 'replace')
    if (state.isOpen) close({ writeUrl: false })
    return
  }

  if (state.isOpen) {
    if (state.currentIndex !== index) {
      const delta = index - state.currentIndex
      navigate(delta, { writeUrl: false })
    }
    return
  }

  const source = findThumbById(id)
  open(index, { source, animate: 'fade', writeUrl: false })
}

const handlePopstate = () => {
  reconcileWithUrl()
}

/** install lightbox listeners (idempotent) and bootstrap from the URL */
export const installLightbox = () => {
  document.addEventListener('click', handleClick)
  document.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', handleResize)
  window.addEventListener('popstate', handlePopstate)
  state.manifest = readManifest()
  // bootstrap from URL if we landed on /art?id=<uuid>
  if (window.location.pathname === ART_PATH) reconcileWithUrl()
}

/** dismiss the lightbox without animation - used on SPA pathname change */
export const dismissLightbox = () => {
  if (!state.isOpen || !state.overlay) return
  if (state.source) state.source.style.visibility = ''
  state.overlay.remove()
  document.body.classList.remove('lightbox-open')
  state.overlay = null
  state.clone = null
  state.source = null
  state.isOpen = false
  state.isAnimating = false
}

/** called by extensions.ts when SPA navigates to a new page */
export const onArtPageEntered = () => {
  state.manifest = readManifest()
  if (window.location.pathname === ART_PATH) reconcileWithUrl()
}
