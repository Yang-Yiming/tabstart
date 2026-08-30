import { Check, Blocks, Pencil, Settings } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { Dashboard } from './components/Dashboard'
import { Slot } from './plugins/Slot'
import { ThemeApplier } from './plugins/ThemeApplier'
import { migratePluginKeys } from './plugins/registry'
import type { ThemeMode } from './config/theme'
import { useBackground } from './hooks/useBackground'
import { useStoredState } from './hooks/useLocalStorage'

const loadSettingsPanel = () =>
  import('./components/SettingsPanel').then((m) => ({ default: m.SettingsPanel }))
const loadPluginManager = () =>
  import('./plugins/PluginManager').then((m) => ({ default: m.PluginManager }))

/**
 * Loads a modal component on demand, resolved outside React.lazy's
 * suspend-and-retry cycle: an already-resolved module is stored in state, so
 * the first open commits synchronously instead of throwing the promise and
 * waiting for a scheduler retry (which showed up as a noticeable stall).
 *
 * The chunk is warmed during idle time and on trigger hover/focus, so by the
 * time the user clicks, the component is ready with zero loading state.
 */
function useLazyModal(load: () => Promise<{ default: ComponentType<any> }>) {
  const [component, setComponent] = useState<ComponentType<any> | null>(null)
  const requestedRef = useRef(false)

  const request = useCallback(() => {
    if (requestedRef.current) return
    requestedRef.current = true
    load()
      .then((m) => setComponent(() => m.default))
      .catch(() => {
        requestedRef.current = false
      })
  }, [load])

  useEffect(() => {
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(request, { timeout: 3000 })
      return () => window.cancelIdleCallback(id)
    }
    const timer = window.setTimeout(request, 2000)
    return () => window.clearTimeout(timer)
  }, [request])

  return { component, request }
}

function ChromeIconButton({
  label,
  onClick,
  onPreload,
  children,
}: {
  label: string
  onClick: () => void
  onPreload?: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onPreload}
      onFocus={onPreload}
      className="chrome-button rounded-full border p-2.5 shadow-lg transition"
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  )
}

/** Overlay shown while a lazily-imported modal chunk is loading. */
function OverlayFallback({ panelClassName }: { panelClassName: string }) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className={`chrome-panel absolute left-1/2 top-1/2 h-[620px] w-[780px] max-h-[85vh] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border shadow-2xl ${panelClassName}`}
      />
    </div>
  )
}

function SettingsButton({
  theme,
  onThemeChange,
  background,
}: {
  theme: ThemeMode
  onThemeChange: (theme: ThemeMode) => void
  background: ReturnType<typeof useBackground>
}) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const { component: SettingsPanelComponent, request: preload } = useLazyModal(loadSettingsPanel)

  return (
    <>
      <ChromeIconButton label="Settings" onClick={() => setOpen(true)} onPreload={preload}>
        <Settings className="h-4 w-4" />
      </ChromeIconButton>
      {open && (SettingsPanelComponent ? (
        <SettingsPanelComponent theme={theme} onThemeChange={onThemeChange} background={background} onClose={close} />
      ) : (
        <OverlayFallback panelClassName="settings-panel" />
      ))}
    </>
  )
}

function PluginsButton() {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const { component: PluginManagerComponent, request: preload } = useLazyModal(loadPluginManager)

  return (
    <>
      <ChromeIconButton label="Plugins" onClick={() => setOpen(true)} onPreload={preload}>
        <Blocks className="h-4 w-4" />
      </ChromeIconButton>
      {open && (PluginManagerComponent ? (
        <PluginManagerComponent onClose={close} />
      ) : (
        <OverlayFallback panelClassName="" />
      ))}
    </>
  )
}

export default function App() {
  const [theme, setTheme] = useStoredState<ThemeMode>('homepage-theme', 'system')
  const [systemDark, setSystemDark] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches,
  )
  const dark = theme === 'dark' || (theme === 'system' && systemDark)

  const background = useBackground()
  const { bg, backgroundSrc } = background

  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    // One-time rewrite of legacy widget keys (e.g. gauge:deepseek-balance) to plugin ids.
    migratePluginKeys().catch(() => {})
  }, [])

  useEffect(() => {
    const root = window.document.documentElement
    if (dark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [dark])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => setSystemDark(event.matches)
    setSystemDark(media.matches)
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  return (
    <>
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundColor: '#121826',
          backgroundImage: backgroundSrc ? `url(${backgroundSrc})` : undefined,
        }}
      />
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, rgba(0,0,0,${Math.max(0.1, bg.overlay - 0.15)}) 0%, rgba(0,0,0,${bg.overlay}) 70%)`,
        }}
      />

      <ThemeApplier />
      <div className="relative">
        <div className="absolute right-5 top-5 z-50 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditing((value) => !value)}
            className={[
              'chrome-button rounded-full border p-2.5 shadow-lg transition',
              isEditing
                ? 'chrome-button-active border-white/25'
                : 'text-white/80',
            ].join(' ')}
            aria-label={isEditing ? 'Done editing' : 'Edit widgets'}
            title={isEditing ? 'Done' : 'Edit widgets'}
          >
            {isEditing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          </button>

          <SettingsButton theme={theme} onThemeChange={setTheme} background={background} />
          <PluginsButton />
        </div>

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-24">
          <div className="w-full max-w-5xl">
            <div className="mx-auto mb-4 max-w-3xl">
              <Slot name="hero.clock" />
            </div>
            <div className="mx-auto mb-10 max-w-2xl">
              <Slot name="hero.search" />
            </div>
            <Dashboard isEditing={isEditing} />
          </div>
        </div>
      </div>
    </>
  )
}
