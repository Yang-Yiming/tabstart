import { Monitor, Moon, Palette, Settings, Sun, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import type { ThemeMode } from '../config/theme'

interface SettingsPanelProps {
  theme: ThemeMode
  onThemeChange: (theme: ThemeMode) => void
}

interface Category {
  id: string
  name: string
  icon: ReactNode
}

const themeOptions: Array<{
  value: ThemeMode
  label: string
  description: string
  icon: ReactNode
}> = [
  { value: 'light', label: '明亮', description: '始终使用明亮外观', icon: <Sun className="h-4 w-4" /> },
  { value: 'dark', label: '黑暗', description: '始终使用黑暗外观', icon: <Moon className="h-4 w-4" /> },
  { value: 'system', label: '跟随系统', description: '自动匹配系统设置', icon: <Monitor className="h-4 w-4" /> },
]

export function SettingsPanel({ theme, onThemeChange }: SettingsPanelProps) {
  const [open, setOpen] = useState(false)

  const categories: Category[] = [
    { id: 'appearance', name: 'Appearance', icon: <Palette className="h-4 w-4" /> },
  ]

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-full border border-white/15 bg-black/20 p-2.5 text-white/80 shadow-lg backdrop-blur-xl transition hover:bg-white/10 hover:text-white"
        aria-label="Settings"
        title="Settings"
      >
        <Settings className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            onClick={(event) => event.stopPropagation()}
            className="absolute left-1/2 top-1/2 flex w-[720px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-white/10 bg-black/60 shadow-2xl backdrop-blur-2xl"
          >
            <div className="w-44 shrink-0 border-r border-white/10 bg-black/30 p-4">
              <h2 className="mb-4 px-2 text-sm font-semibold text-white">Settings</h2>
              <div className="flex flex-col gap-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm text-white"
                  >
                    {category.icon}
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex min-h-[360px] flex-1 flex-col">
              <div className="flex items-center justify-between border-b border-white/10 p-6">
                <h3 className="text-lg font-medium text-white">Appearance</h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 p-6">
                <div>
                  <h4 className="text-sm font-medium text-white">主题</h4>
                  <p className="mt-1 text-xs text-white/50">选择界面的明暗外观。</p>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2" role="radiogroup" aria-label="主题">
                  {themeOptions.map((option) => {
                    const selected = theme === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => onThemeChange(option.value)}
                        className={[
                          'flex min-h-24 flex-col items-start justify-between rounded-2xl border p-3 text-left transition',
                          selected
                            ? 'border-white/30 bg-white/15 text-white shadow-lg'
                            : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10 hover:text-white/85',
                        ].join(' ')}
                      >
                        {option.icon}
                        <span>
                          <span className="block text-sm font-medium">{option.label}</span>
                          <span className="mt-0.5 block text-[10px] leading-4 text-white/45">
                            {option.description}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
