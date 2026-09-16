import { Check, Blocks, Pencil, Settings } from 'lucide-react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Dashboard } from './components/Dashboard'
import { Slot } from './plugins/Slot'
import { ThemeApplier } from './plugins/ThemeApplier'
import { migratePluginKeys } from './plugins/registry'
import {
  DEFAULT_FONT_FAMILY,
  FONT_FAMILY_KEY,
  normalizeFontFamily,
  type FontFamily,
} from './config/preferences'
import type { ThemeMode } from './config/theme'
import { useBackground } from './hooks/useBackground'
import type { BackgroundControls } from './hooks/useBackground'
import { useLazyComponent } from './hooks/useLazyComponent'
import { useStoredState } from './hooks/useLocalStorage'
import { applyFontFamily } from './lib/webFonts'

const loadSettingsPanel = () =>
  import('./components/SettingsPanel').then((m) => ({ default: m.SettingsPanel }))
const loadPluginManager = () =>
  import('./plugins/PluginManager').then((m) => ({ default: m.PluginManager }))

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
  fontFamily,
  onFontFamilyChange,
  background,
}: {
  theme: ThemeMode
  onThemeChange: (theme: ThemeMode) => void
  fontFamily: FontFamily
  onFontFamilyChange: (font: FontFamily) => void
  background: BackgroundControls
}) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const { component: SettingsPanelComponent, request: preload } = useLazyComponent(loadSettingsPanel)

  return (
    <>
      <ChromeIconButton label="Settings" onClick={() => setOpen(true)} onPreload={preload}>
        <Settings className="h-4 w-4" />
      </ChromeIconButton>
      {open && (SettingsPanelComponent ? (
        <SettingsPanelComponent
          theme={theme}
          onThemeChange={onThemeChange}
          fontFamily={fontFamily}
          onFontFamilyChange={onFontFamilyChange}
          background={background}
          onClose={close}
        />
      ) : (
        <OverlayFallback panelClassName="settings-panel" />
      ))}
    </>
  )
}

function PluginsButton() {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])
  const { component: PluginManagerComponent, request: preload } = useLazyComponent(loadPluginManager)

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
  const [fontFamily, setFontFamily, fontHydrated] = useStoredState<FontFamily>(
    FONT_FAMILY_KEY,
    DEFAULT_FONT_FAMILY,
  )
  const [systemDark, setSystemDark] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches,
  )
  const dark = theme === 'dark' || (theme === 'system' && systemDark)

  const background = useBackground()
  const { bg, backgroundSrc } = background

  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    // `webFonts.ts` already applied the stored value at boot. This effect only
    // has to react to later changes — and it must wait for hydration, because
    // before that `fontFamily` is still the default and applying it would
    // overwrite the value boot just resolved (visible as a flash of the system
    // stack for an Inter user).
    if (!fontHydrated) return
    void applyFontFamily(normalizeFontFamily(fontFamily))
  }, [fontFamily, fontHydrated])

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

          <SettingsButton
            theme={theme}
            onThemeChange={setTheme}
            fontFamily={fontFamily}
            onFontFamilyChange={setFontFamily}
            background={background}
          />
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
