import type { RouteContext } from '@touchlesscode/core/edge'
import { renderClientToString, raw } from '@touchlesscode/core/edge'
import ersScript from '@touchlesscode/core/client/browser?raw'
import extensionsScript from '../render/_extensionsBundle'

import { cssVars, globalStyles, themeScript, getThemeFromCookie, getPaletteFromCookie } from '../render/styles'
import { icons } from '../render/icons'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Stefan Šoć-McLeod',
  '/experience': 'Selected Engagements · Stefan Šoć-McLeod',
  '/technologies': 'Capabilities · Stefan Šoć-McLeod',
  '/art': 'Art · Stefan Šoć-McLeod',
}

type NavItem = {
  readonly label: string
  readonly href: string
  readonly icon: string
  readonly external?: boolean
}

const navItems: readonly NavItem[] = [
  { label: 'Home', href: '/', icon: icons.home },
  { label: 'Experience', href: '/experience', icon: icons.briefcase },
  { label: 'Capabilities', href: '/technologies', icon: icons.code },
  { label: 'Art', href: '/art', icon: icons.palette },
  { label: 'Contact', href: 'mailto:stefan.soc@gmail.com', icon: icons.mail, external: true },
]

const escapeInline = (script: string): string =>
  script.replace(/<\/script/gi, '<\\/script')

const isActive = (href: string, currentPath: string) =>
  href === currentPath ? 'active' : ''

/** top header nav with logo, page links, palette + theme toggle */
const renderTopNav = (currentPath: string) => (
  <header class="top-nav">
    <a href="/" class="logo" data-nav-link={true} data-prefetch={true}>stef.online</a>
    <div class="nav-links">
      {navItems.map(item =>
        item.external
          ? <a href={item.href} class={isActive(item.href, currentPath)}>{item.label}</a>
          : <a href={item.href} data-nav-link={true} data-prefetch={true} class={isActive(item.href, currentPath)}>{item.label}</a>
      )}
      <button id="palette-cycle-btn" class="icon-btn palette-btn" aria-label="Cycle color palette">
        <span class="palette-dot"></span>
      </button>
      <button id="theme-toggle-btn" class="icon-btn theme-toggle" aria-label="Toggle theme">
        <span class="theme-icon-sun">{raw(icons.sun)}</span>
        <span class="theme-icon-moon" style="display:none">{raw(icons.moon)}</span>
      </button>
    </div>
  </header>
)

/** mobile-first sticky bottom nav */
const renderBottomNav = (currentPath: string) => (
  <div class="bottom-nav">
    <nav>
      {navItems.map(item =>
        item.external
          ? <a href={item.href} class={isActive(item.href, currentPath)}>{raw(item.icon)}<span>{item.label}</span></a>
          : <a href={item.href} data-nav-link={true} data-prefetch={true} class={isActive(item.href, currentPath)}>{raw(item.icon)}<span>{item.label}</span></a>
      )}
    </nav>
  </div>
)

/** site footer with copyright and the ers + fabric attribution link */
const renderFooter = () => (
  <footer class="footer">
    <p>&copy; {new Date().getFullYear()} Stefan Šoć-McLeod</p>
    <p class="footer-meta">
      <button type="button" data-open-ers-modal={true} class="footer-meta-link">made with ERS + fabric</button>
    </p>
  </footer>
)

/** native dialog explaining the underlying meta-framework */
const renderErsModal = () => (
  <dialog id="ers-modal">
    <div class="ers-modal-inner">
      <button class="ers-modal-close" aria-label="Close">{raw('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>')}</button>
      <h2>Made with ERS + fabric</h2>
      <p>
        This site runs on the <strong>EXO Rendering System (ERS)</strong> — a server-rendered, hydrate-in-browser
        component framework that ships SSR HTML from <strong>Cloudflare Workers</strong> and re-attaches
        interactivity once JavaScript loads. Think of it as <strong>Next.js for Cloudflare</strong>, currently
        built on <strong>Solid.js</strong> — though the architecture is framework-agnostic and other runtimes
        plug in cleanly.
      </p>
      <p>
        The system co-locates server and client code in <code>.fabric.tsx</code> files. Functions tagged
        <code>@server</code> become typed RPC endpoints on the edge; <code>@client</code> functions inline as
        bootstrap scripts; and a <strong>Durable-Object-backed WebSocket transport</strong> keeps the
        client/edge dialog open for real-time work. Even this footer link is wired up by a <code>@client</code>
        directive.
      </p>
      <p>
        I designed and built the meta-framework during the initial R&amp;D phase at <strong>Touchless / Auto
        Genius</strong>, and have remained the principal engineer on it since. There is also a related
        <strong>US patent</strong> filed under my name on the architecture.
      </p>
    </div>
  </dialog>
)

/**
 * one-shot client wiring for the page chrome — runs after window.exo.ers is
 * ready (the fabric IIFE waits and then auto-invokes this function).
 *
 * note: the fabric transformer inlines this function body verbatim into a
 * browser script tag without TypeScript stripping, so the body must be plain
 * JS-compatible syntax (no type annotations, generics, or `as` casts).
 */
/** @client */
function setupChromeInteractions() {
  const palettes = ['midnight', 'neon', 'sunset', 'forest', 'vapor']
  const html = document.documentElement

  const updateThemeIcon = (theme) => {
    const sun = document.querySelector('.theme-icon-sun')
    const moon = document.querySelector('.theme-icon-moon')
    if (sun) sun.style.display = theme === 'dark' ? '' : 'none'
    if (moon) moon.style.display = theme === 'dark' ? 'none' : ''
  }

  const themeButton = document.getElementById('theme-toggle-btn')
  if (themeButton) {
    themeButton.addEventListener('click', () => {
      const next = (html.getAttribute('data-theme') || 'dark') === 'dark' ? 'light' : 'dark'
      html.setAttribute('data-theme', next)
      document.cookie = 'theme=' + next + ';path=/;max-age=31536000;SameSite=Lax'
      updateThemeIcon(next)
    })
  }

  const paletteButton = document.getElementById('palette-cycle-btn')
  if (paletteButton) {
    paletteButton.addEventListener('click', () => {
      const current = html.getAttribute('data-palette') || 'midnight'
      const next = palettes[(palettes.indexOf(current) + 1) % palettes.length]
      html.setAttribute('data-palette', next)
      document.cookie = 'palette=' + next + ';path=/;max-age=31536000;SameSite=Lax'
    })
  }

  const modal = document.getElementById('ers-modal')
  document.querySelectorAll('[data-open-ers-modal]').forEach((element) => {
    element.addEventListener('click', (event) => {
      event.preventDefault()
      if (modal && typeof modal.showModal === 'function') modal.showModal()
    })
  })
  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) modal.close()
    })
    const closeButton = modal.querySelector('.ers-modal-close')
    if (closeButton) closeButton.addEventListener('click', () => modal.close())
  }

  updateThemeIcon(html.getAttribute('data-theme') || 'dark')
}

export const GET = async (content: Response, context: RouteContext): Promise<string> => {
  const text = await content.text()

  let innerHtml = text
  let childHead = ''
  try {
    const data = JSON.parse(text) as Record<string, unknown>
    innerHtml = (data.html as string) || text
    childHead = typeof data.head === 'string' ? data.head : ''
  } catch {
    // not page-data, treat as raw html
  }

  const request = context.request as Request
  const url = new URL(request.url)
  const path = url.pathname === '/' ? '/' : url.pathname.replace(/\/$/, '')
  const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  const socketBaseURL = `${wsProtocol}//${url.host}`

  const cookie = request.headers.get('cookie')
  const theme = getThemeFromCookie(cookie)
  const palette = getPaletteFromCookie(cookie)

  const title = PAGE_TITLES[path] ?? PAGE_TITLES['/']
  const ersBootstrapHtml = await renderClientToString(ersScript, {
    transport: {
      type: 'hybrid',
      fetch: { baseURL: '' },
      socket: { baseURL: socketBaseURL },
    },
  } as any)

  const tree = (
    <html lang="en" data-theme={theme} data-palette={palette}>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <meta name="description" content="Engineering leader. Portfolio and CV." />
        {raw(childHead)}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <style>{raw(cssVars + globalStyles)}</style>
        <script>{raw(themeScript)}</script>
      </head>
      <body>
        {raw(ersBootstrapHtml)}
        {renderTopNav(path)}
        <main id="main" exo-slot={true}>{raw(innerHtml)}</main>
        {renderFooter()}
        {renderBottomNav(path)}
        {renderErsModal()}
        <script>{raw(escapeInline(extensionsScript))}</script>
      </body>
    </html>
  )

  return `<!DOCTYPE html>${(tree as unknown as { __html: string }).__html}`
}

// also export as `layout` for compatibility with virtual:ers-routes registry
export const layout = GET
