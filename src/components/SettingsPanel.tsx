import { Folder, LayoutGrid, Monitor, Moon, Palette, Settings, Sun, X } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ThemeMode } from '../config/theme'
import { variantKey, widgetGroups } from '../widgets/registry'
import { useWidgetSettings } from '../widgets/widgetSettings'
import type { WidgetSettingsSchema } from '../widgets/types'
import { SettingField } from './SettingField'

interface SettingsPanelProps {
  theme: ThemeMode
  onThemeChange: (theme: ThemeMode) => void
}

interface Category {
  id: 'appearance' | 'widgets'
  name: string
  icon: ReactNode
}

interface SettingsEntry {
  key: string
  groupName: string
  label: string
  schema: WidgetSettingsSchema
}

interface SidebarGroup {
  groupName: string
  entries: SettingsEntry[]
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

const categories: Category[] = [
  { id: 'appearance', name: 'Appearance', icon: <Palette className="h-4 w-4" /> },
  { id: 'widgets', name: 'Widgets', icon: <LayoutGrid className="h-4 w-4" /> },
]

export function SettingsPanel({ theme, onThemeChange }: SettingsPanelProps) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<'appearance' | 'widgets'>('appearance')
  const [widgetsOpen, setWidgetsOpen] = useState(false)
  const [activeWidgetKey, setActiveWidgetKey] = useState<string | null>(null)

  const sidebarGroups = useMemo<SidebarGroup[]>(() => {
    const groups: SidebarGroup[] = []
    for (const group of widgetGroups) {
      const withSettings = group.variants.filter((variant) => variant.settings ?? group.settings)
      if (withSettings.length === 0) continue
      groups.push({
        groupName: group.name,
        entries: withSettings.map((variant) => ({
          key: variantKey(group.id, variant.id),
          groupName: group.name,
          label: withSettings.length === 1 ? group.name : variant.label,
          schema: (variant.settings ?? group.settings)!,
        })),
      })
    }
    return groups
  }, [])

  const activeEntry = useMemo(
    () => sidebarGroups.flatMap((group) => group.entries).find((entry) => entry.key === activeWidgetKey) ?? null,
    [sidebarGroups, activeWidgetKey],
  )

  const selectCategory = (id: 'appearance' | 'widgets') => {
    if (id === 'widgets') {
      if (active === 'widgets') {
        setActive('appearance')
        setWidgetsOpen(false)
      } else {
        setActive('widgets')
        setWidgetsOpen(true)
      }
    } else {
      setActive('appearance')
    }
  }

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  useEffect(() => {
    if (active === 'widgets' && !activeEntry && sidebarGroups.length > 0) {
      setActiveWidgetKey(sidebarGroups[0].entries[0].key)
    }
  }, [active, activeEntry, sidebarGroups])

  const headerTitle = active === 'appearance' ? 'Appearance' : (activeEntry?.label ?? 'Widgets')

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
            className="absolute left-1/2 top-1/2 flex max-h-[85vh] w-[720px] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-white/10 bg-black/60 shadow-2xl backdrop-blur-2xl"
          >
            <div className="w-44 shrink-0 overflow-y-auto border-r border-white/10 bg-black/30 p-4">
              <h2 className="mb-4 px-2 text-sm font-semibold text-white">Settings</h2>
              <div className="flex flex-col gap-1">
                {categories.map((category) => (
                  <div key={category.id} className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => selectCategory(category.id)}
                      className={[
                        'flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition',
                        active === category.id
                          ? 'bg-white/10 text-white'
                          : 'text-white/50 hover:bg-white/5 hover:text-white/85',
                      ].join(' ')}
                    >
                      {category.icon}
                      {category.name}
                    </button>
                    {category.id === 'widgets' && widgetsOpen && sidebarGroups.length > 0 && (
                      <div className="ml-4 flex flex-col gap-0.5 border-l border-white/10 pl-2">
                        {sidebarGroups.map((group) =>
                          group.entries.length === 1 ? (
                            <button
                              key={group.entries[0].key}
                              type="button"
                              onClick={() => setActiveWidgetKey(group.entries[0].key)}
                              className={[
                                'rounded-lg px-2 py-1.5 text-left text-xs transition',
                                active === 'widgets' && activeEntry?.key === group.entries[0].key
                                  ? 'bg-white/10 text-white'
                                  : 'text-white/45 hover:bg-white/5 hover:text-white/80',
                              ].join(' ')}
                            >
                              {group.groupName}
                            </button>
                          ) : (
                            <div key={group.groupName} className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                                <Folder className="h-3 w-3 shrink-0" />
                                {group.groupName}
                              </div>
                              {group.entries.map((entry) => (
                                <button
                                  key={entry.key}
                                  type="button"
                                  onClick={() => setActiveWidgetKey(entry.key)}
                                  className={[
                                    'flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs transition',
                                    active === 'widgets' && activeEntry?.key === entry.key
                                      ? 'bg-white/10 text-white'
                                      : 'text-white/45 hover:bg-white/5 hover:text-white/80',
                                  ].join(' ')}
                                >
                                  <span
                                    className={[
                                      'h-1 w-1 shrink-0 rounded-full',
                                      active === 'widgets' && activeEntry?.key === entry.key
                                        ? 'bg-sky-300/80'
                                        : 'bg-white/25',
                                    ].join(' ')}
                                  />
                                  {entry.label}
                                </button>
                              ))}
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex min-h-[360px] flex-1 flex-col">
              <div className="flex items-center justify-between border-b border-white/10 p-6">
                <h3 className="text-lg font-medium text-white">{headerTitle}</h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-6">
                {active === 'appearance' ? (
                  <AppearanceSection theme={theme} onThemeChange={onThemeChange} />
                ) : activeEntry ? (
                  <WidgetSettingsSection entry={activeEntry} />
                ) : (
                  <p className="text-sm text-white/50">没有可配置的 widget。</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AppearanceSection({
  theme,
  onThemeChange,
}: {
  theme: ThemeMode
  onThemeChange: (theme: ThemeMode) => void
}) {
  return (
    <>
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
    </>
  )
}

function WidgetSettingsSection({ entry }: { entry: SettingsEntry }) {
  const { settings, setSetting } = useWidgetSettings(entry.key)
  const schema = entry.schema
  const visibleFields = schema.fields.filter((field) => !field.showWhen || field.showWhen(settings))

  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-sm font-medium text-white">{schema.title}</h4>
        {schema.description && <p className="mt-1 text-xs text-white/50">{schema.description}</p>}
      </div>
      {visibleFields.map((field) => (
        <SettingField
          key={field.key}
          field={field}
          value={settings[field.key]}
          onChange={(value) => setSetting(field.key, value)}
        />
      ))}
    </div>
  )
}
