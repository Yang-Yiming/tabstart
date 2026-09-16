/**
 * Web font loading.
 *
 * The font stylesheet used to be a render-blocking `<link>` in `index.html`, so
 * the browser refused to paint until `fonts.googleapis.com` answered. That is
 * ~150 ms on a fast connection, and the cost is unbounded when the host is slow
 * or unreachable — measured by stalling the request, first paint moved 1:1 with
 * the delay (+2100 ms for a 2.5 s stall).
 *
 * Injecting the same stylesheet from JavaScript takes it off the critical path:
 * the page paints with the fallback stack immediately and swaps when the font
 * arrives, which is the swap behavior the URL's `display=swap` already asked
 * for.
 *
 * Note the usual trick for this — `<link media="print" onload="this.media='all'">`
 * — cannot be used here, because an inline event handler is blocked by the MV3
 * extension CSP and this page also ships as a browser extension.
 */

const FONT_STYLESHEET =
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap'

/**
 * Issued alongside the stylesheet rather than from `index.html`: the page picks
 * its font family after hydration, so a preconnect sitting in the HTML would
 * cost a connection on every load for users who never request a web font.
 * Preconnecting to `gstatic` still pays off, because the font files live on that
 * second origin and the handshake then overlaps the stylesheet fetch.
 */
const FONT_ORIGINS = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com']

let pending: Promise<void> | null = null

/** Injects the font stylesheet once; resolves when it has loaded or failed. */
export function loadWebFonts(): Promise<void> {
  if (pending) return pending

  pending = new Promise<void>((resolve) => {
    for (const origin of FONT_ORIGINS) {
      const preconnect = document.createElement('link')
      preconnect.rel = 'preconnect'
      preconnect.href = origin
      if (origin.includes('gstatic')) preconnect.crossOrigin = 'anonymous'
      document.head.appendChild(preconnect)
    }

    const stylesheet = document.createElement('link')
    stylesheet.rel = 'stylesheet'
    stylesheet.href = FONT_STYLESHEET

    // Resolve either way: a failed font must not leave callers waiting.
    const settle = () => resolve()
    stylesheet.addEventListener('load', settle, { once: true })
    stylesheet.addEventListener('error', settle, { once: true })

    document.head.appendChild(stylesheet)
  })

  return pending
}
