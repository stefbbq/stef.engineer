import { clientExtension as infiniteScroll } from '@touchlesscode/core-extensions/infinite-scroll'
import { clientExtension as linkPrefetch } from '@touchlesscode/core-extensions/link-prefetch'
import { installLightbox, dismissLightbox } from './lightbox'
import { installArtGrid, ensureArtGrid } from './artGrid'

declare const window: any

const INFINITE_SCROLL_CONFIG = {
  containerSelector: '[data-infinite-scroll]',
  loadMore: { moduleId: 'routes/art', fn: 'loadArtPage' },
  prewarm: { moduleId: 'routes/art', fn: 'prewarmArtPage' },
  warmThresholdPercent: 50,
  viewportOffset: 200,
}

const LINK_PREFETCH_CONFIG = {
  linkSelector: '[data-prefetch]',
  hoverDelay: 80,
  prefetchOnIntersection: false,
  maxCacheSize: 16,
}

let infiniteScrollRegistered = false

const normalizePath = (path: string): string =>
  path === '/' ? '/' : path.replace(/\/$/, '')

/** updates `.active` class on every nav link to match the current URL */
const updateActiveNav = () => {
  const current = normalizePath(window.location.pathname)
  document.querySelectorAll('[data-nav-link]').forEach((element: Element) => {
    const href = element.getAttribute('href')
    element.classList.toggle('active', href === current)
  })
}

/**
 * the official infinite-scroll extension only inspects the DOM at register
 * time. on a SPA-routed site the [data-infinite-scroll] container only
 * appears after navigating to /art, so the first registration is a no-op.
 *
 * we re-register whenever a container shows up. the extension de-duplicates
 * internally by name so this is safe to call repeatedly.
 */
const ensureInfiniteScroll = () => {
  const ers = window?.ers
  if (!ers || !ers.extensions) return
  const container = document.querySelector('[data-infinite-scroll]')
  if (!container) return
  if (container.getAttribute('data-infinite-scroll-attached') === '1') return

  try {
    ers.extensions.register(infiniteScroll, INFINITE_SCROLL_CONFIG)
    container.setAttribute('data-infinite-scroll-attached', '1')
    infiniteScrollRegistered = true
  } catch (error) {
    console.warn('infinite-scroll re-register failed', error)
  }
}

const onNavigation = () => {
  dismissLightbox()
  updateActiveNav()
  // give the new content a tick to mount before looking for the container
  setTimeout(() => {
    ensureInfiniteScroll()
    ensureArtGrid()
  }, 30)
}

const installNavigationHooks = () => {
  // patch history methods so we get notified on programmatic navigation (which
  // is what the ERS router uses for SPA navigation)
  const wrap = (method: 'pushState' | 'replaceState') => {
    const original = window.history[method].bind(window.history)
    window.history[method] = function patched(...args: unknown[]) {
      const result = original(...args)
      onNavigation()
      return result
    }
  }
  wrap('pushState')
  wrap('replaceState')
  window.addEventListener('popstate', onNavigation)
}

const register = () => {
  const ers = window?.ers
  if (!ers || !ers.extensions) {
    setTimeout(register, 50)
    return
  }

  ensureInfiniteScroll()

  try {
    ers.extensions.register(linkPrefetch, LINK_PREFETCH_CONFIG)
  } catch (error) {
    console.warn('link-prefetch register failed', error)
  }

  installNavigationHooks()
  installLightbox()
  installArtGrid()
  ensureArtGrid()
  updateActiveNav()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', register)
} else {
  register()
}
