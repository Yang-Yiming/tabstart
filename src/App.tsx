import { Check, Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { SettingsPanel } from './components/SettingsPanel'
import { PluginManager } from './plugins/PluginManager'
import { Slot } from './plugins/Slot'
import { ThemeApplier } from './plugins/ThemeApplier'
import { migratePluginKeys } from './plugins/registry'
import type { ThemeMode } from './config/theme'
import { useBackground } from './hooks/useBackground'
import { useStoredState } from './hooks/useLocalStorage'

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
                ? 'border-white/25 bg-white/20 text-white'
                : 'text-white/80',
            ].join(' ')}
            aria-label={isEditing ? 'Done editing' : 'Edit widgets'}
            title={isEditing ? 'Done' : 'Edit widgets'}
          >
            {isEditing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          </button>

          <SettingsPanel theme={theme} onThemeChange={setTheme} background={background} />
          <PluginManager />
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
