import { useEffect } from 'react'
import { useActiveTheme } from './hooks'

/**
 * Applies the active plugin theme to the document root.
 *
 * - sets `data-theme` on <html>
 * - adds `rootClass` when provided
 * - writes `tokens` as inline CSS custom properties (and removes them on cleanup)
 * - injects `css` into <head> (and removes it on cleanup)
 */
export function ThemeApplier() {
  const { activeTheme } = useActiveTheme()

  useEffect(() => {
    const root = document.documentElement
    if (!activeTheme) {
      delete root.dataset.theme
      return
    }

    root.dataset.theme = activeTheme.id
    if (activeTheme.rootClass) root.classList.add(activeTheme.rootClass)

    const tokenEntries = Object.entries(activeTheme.tokens ?? {})
    for (const [key, value] of tokenEntries) {
      root.style.setProperty(key, value)
    }

    let style: HTMLStyleElement | null = null
    if (activeTheme.css) {
      style = document.createElement('style')
      style.dataset.pluginTheme = activeTheme.id
      style.textContent = activeTheme.css
      document.head.appendChild(style)
    }

    return () => {
      delete root.dataset.theme
      if (activeTheme.rootClass) root.classList.remove(activeTheme.rootClass)
      for (const [key] of tokenEntries) {
        root.style.removeProperty(key)
      }
      style?.remove()
    }
  }, [activeTheme])

  return null
}
