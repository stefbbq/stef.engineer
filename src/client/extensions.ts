import { clientExtension as infiniteScroll } from '@touchlesscode/core-extensions/infinite-scroll'
import { clientExtension as linkPrefetch } from '@touchlesscode/core-extensions/link-prefetch'
import { installLightbox, dismissLightbox, onArtPageEntered } from './lightbox'
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

const INFINITE_SCROLL_NAME = 'infinite-scroll'

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
 * time and captures references to the container + its sentinels in onInit.
 * on a SPA-routed site the [data-infinite-scroll] container is replaced
 * each time we navigate back into /art, so the prior registration is now
 * observing detached nodes.
 *
 * tear down any prior registration before re-registering against the new
 * container — register() is a no-op when the extension name already exists,
 * so without unregister() onInit never re-runs.
 */
const ensureInfiniteScroll = () => {
  const ers = window?.ers
  if (!ers || !ers.extensions) return
  const container = document.querySelector('[data-infinite-scroll]')
  if (!container) return
  if (container.getAttribute('data-infinite-scroll-attached') === '1') return

  if (ers.extensions.get && ers.extensions.get(INFINITE_SCROLL_NAME)) {
    try { ers.extensions.unregister(INFINITE_SCROLL_NAME) } catch (_unregisterError) {}
  }

  try {
    ers.extensions.register(infiniteScroll, INFINITE_SCROLL_CONFIG)
    container.setAttribute('data-infinite-scroll-attached', '1')
  } catch (error) {
    console.warn('infinite-scroll register failed', error)
  }
}

let lastPath = normalizePath(window.location.pathname)

const onNavigation = () => {
  const nextPath = normalizePath(window.location.pathname)

  // query-only updates (e.g. ?id=... for the art deep-linked lightbox) should
  // not dismiss the lightbox or restart grid extensions. update the active-nav
  // indicator and bail.
  if (nextPath === lastPath) {
    updateActiveNav()
    return
  }

  lastPath = nextPath
  dismissLightbox()
  updateActiveNav()
  // give the new content a tick to mount before looking for the container
  setTimeout(() => {
    ensureInfiniteScroll()
    ensureArtGrid()
    // if we just landed on /art (via SPA nav), re-read manifest + bootstrap
    // any ?id=... present in the URL
    onArtPageEntered()
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

/**
 * drive the `--scroll-y` custom property on <html> from the window scroll
 * position so the fixed dot-grid pseudo-element can shift its
 * background-position in css and appear to travel with the page.
 *
 * the radial halo layer stays truly fixed; only the grid tracks scroll.
 */
const installScrollTracking = () => {
  const root = document.documentElement
  let ticking = false
  const update = () => {
    root.style.setProperty('--scroll-y', `${window.scrollY}px`)
    ticking = false
  }
  const onScroll = () => {
    if (ticking) return
    ticking = true
    window.requestAnimationFrame(update)
  }
  update()
  window.addEventListener('scroll', onScroll, { passive: true })
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
  installScrollTracking()
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
