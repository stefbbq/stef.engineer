/**
 * art gallery lightbox.
 *
 * - tap thumbnail → clone animates from its current position to fit-to-viewport
 * - dark backdrop fades in over everything else
 * - left/right arrows + buttons swap to neighboring images
 * - esc, backdrop click, or close button dismisses (animates back to source)
 * - closes automatically on SPA navigation
 *
 * uses FLIP-style animation (capture source rect, position absolutely, then
 * transition to target rect). everything is one cloned <img>; the original
 * stays in the grid as a ghost placeholder so the close animation has a target.
 */

declare const window: any
declare const document: any
declare const requestAnimationFrame: (cb: FrameRequestCallback) => number

const ANIM_MS = 380

type State = {
  isOpen: boolean
  isAnimating: boolean
  currentIndex: number
  items: HTMLImageElement[]
  overlay: HTMLDivElement | null
  clone: HTMLImageElement | null
  source: HTMLImageElement | null
}

const state: State = {
  isOpen: false,
  isAnimating: false,
  currentIndex: 0,
  items: [],
  overlay: null,
  clone: null,
  source: null,
}

const refreshItems = () => {
  state.items = Array.from(document.querySelectorAll('.art-item img')) as HTMLImageElement[]
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
    close()
  })
  prevBtn.addEventListener('click', (event: MouseEvent) => {
    event.stopPropagation()
    navigate(-1)
  })
  nextBtn.addEventListener('click', (event: MouseEvent) => {
    event.stopPropagation()
    navigate(1)
  })
  overlay.addEventListener('click', (event: MouseEvent) => {
    if (event.target === overlay || event.target === state.clone) close()
  })

  return overlay
}

const open = (index: number) => {
  if (state.isAnimating) return
  refreshItems()
  if (index < 0 || index >= state.items.length) return

  state.isOpen = true
  state.isAnimating = true
  state.currentIndex = index
  state.source = state.items[index]

  const sourceRect = state.source.getBoundingClientRect()

  state.overlay = buildOverlay()
  state.clone = document.createElement('img')
  state.clone.className = 'lightbox-image'
  state.clone.alt = state.source.alt || ''
  state.clone.src = state.source.currentSrc || state.source.src
  state.clone.style.position = 'fixed'
  applyRect(state.clone, sourceRect)
  state.overlay.appendChild(state.clone)

  document.body.appendChild(state.overlay)
  document.body.classList.add('lightbox-open')

  // ghost the source so closing back to it looks coherent
  state.source.style.visibility = 'hidden'

  requestAnimationFrame(() => {
    state.overlay?.classList.add('open')
    if (!state.clone || !state.source) return
    const naturalWidth = state.clone.naturalWidth || state.source.naturalWidth || 1600
    const naturalHeight = state.clone.naturalHeight || state.source.naturalHeight || 1200
    const target = computeFitRect(naturalWidth, naturalHeight)
    applyRect(state.clone, target)
  })

  setTimeout(() => {
    state.isAnimating = false
  }, ANIM_MS)
}

const close = () => {
  if (!state.isOpen || state.isAnimating || !state.overlay || !state.clone || !state.source) return
  state.isAnimating = true
  state.isOpen = false

  const sourceRect = state.source.getBoundingClientRect()
  applyRect(state.clone, sourceRect)
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
}

const navigate = (delta: number) => {
  if (!state.isOpen || state.isAnimating || !state.clone || !state.source) return
  refreshItems()
  if (state.items.length < 2) return

  const nextIndex = (state.currentIndex + delta + state.items.length) % state.items.length
  if (nextIndex === state.currentIndex) return

  // un-ghost previous source
  state.source.style.visibility = ''

  state.currentIndex = nextIndex
  state.source = state.items[nextIndex]
  state.source.style.visibility = 'hidden'

  const newSrc = state.source.currentSrc || state.source.src
  state.clone.classList.add('swapping')

  const swap = () => {
    if (!state.clone || !state.source) return
    state.clone.src = newSrc
    const handleLoad = () => {
      if (!state.clone || !state.source) return
      const naturalWidth = state.clone.naturalWidth || 1600
      const naturalHeight = state.clone.naturalHeight || 1200
      const target = computeFitRect(naturalWidth, naturalHeight)
      applyRect(state.clone, target)
      state.clone.classList.remove('swapping')
    }
    if (state.clone.complete && state.clone.naturalWidth > 0) {
      handleLoad()
    } else {
      state.clone.addEventListener('load', handleLoad, { once: true })
    }
  }

  // small delay so the fade-out of the old image is visible
  setTimeout(swap, 80)
}

const handleClick = (event: MouseEvent) => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
  if (state.isOpen) return

  const target = event.target as HTMLElement
  const figure = target.closest('.art-item') as HTMLElement | null
  if (!figure) return
  const img = figure.querySelector('img') as HTMLImageElement | null
  if (!img) return

  refreshItems()
  const index = state.items.indexOf(img)
  if (index < 0) return

  event.preventDefault()
  open(index)
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!state.isOpen) return
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    navigate(-1)
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    navigate(1)
  }
}

const handleResize = () => {
  if (!state.isOpen || !state.clone || !state.source) return
  const target = computeFitRect(state.clone.naturalWidth || 1600, state.clone.naturalHeight || 1200)
  applyRect(state.clone, target)
}

/** call to install lightbox listeners (idempotent) */
export const installLightbox = () => {
  document.addEventListener('click', handleClick)
  document.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', handleResize)
}

/** dismiss the lightbox without animation - used on SPA nav */
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
