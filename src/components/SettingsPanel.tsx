import {
  Folder,
  Globe,
  LayoutGrid,
  Link,
  Monitor,
  Moon,
  Palette,
  Settings,
  Sun,
  Upload,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ThemeMode } from '../config/theme'
import type { BackgroundControls } from '../hooks/useBackground'
import { groupPlugins, pluginById, plugins, useEnabledPlugins } from '../plugins/registry'
import { useWidgetSettings } from '../plugins/widgetSettings'
import type { WidgetSettingsSchema } from '../plugins/types'
import { SettingField } from './SettingField'

interface SettingsPanelProps {
  theme: ThemeMode
  onThemeChange: (theme: ThemeMode) => void
  background: BackgroundControls
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
  schema: WidgetSettingsSchema | null
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

export function SettingsPanel({ theme, onThemeChange, background }: SettingsPanelProps) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<'appearance' | 'widgets'>('appearance')
  const [widgetsOpen, setWidgetsOpen] = useState(false)
  const [activeWidgetKey, setActiveWidgetKey] = useState<string | null>(null)

  const { isEnabled } = useEnabledPlugins()

  const sidebarGroups = useMemo<SidebarGroup[]>(() => {
    const withSettings = plugins.filter(
      (plugin) => isEnabled(plugin.id) && (plugin.settings || plugin.settingsComponent),
    )
    return groupPlugins(withSettings).map((group) => ({
      groupName: group.name,
      entries: group.plugins.map((plugin) => ({
        key: plugin.id,
        groupName: group.name,
        label: plugin.name,
        schema: plugin.settings ?? null,
      })),
    }))
  }, [isEnabled])

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
                              {group.entries[0].label}
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
                  <AppearanceSection
                    theme={theme}
                    onThemeChange={onThemeChange}
                    background={background}
                  />
                ) : activeEntry ? (
                  <WidgetSettingsSection key={activeEntry.key} entry={activeEntry} />
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
  background,
}: {
  theme: ThemeMode
  onThemeChange: (theme: ThemeMode) => void
  background: BackgroundControls
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

      <WallpaperSection background={background} />
    </>
  )
}

function WallpaperSection({ background }: { background: BackgroundControls }) {
  const { backgroundSrc, fileInputRef, handleFileChange, applyUrl, applyBing } = background
  const [urlOpen, setUrlOpen] = useState(false)
  const [urlValue, setUrlValue] = useState('')

  const applyUrlInput = () => {
    applyUrl(urlValue)
    setUrlValue('')
    setUrlOpen(false)
  }

  return (
    <div className="mt-8">
      <div>
        <h4 className="text-sm font-medium text-white">壁纸</h4>
        <p className="mt-1 text-xs text-white/50">选择启动页的背景图片。</p>
      </div>

      <div className="mt-4 h-28 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        {backgroundSrc ? (
          <div
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundSrc})` }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-white/40">
            当前没有背景图片
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 text-white/60 transition hover:border-white/20 hover:bg-white/10 hover:text-white/85"
        >
          <Upload className="h-4 w-4" />
          <span className="text-xs font-medium">本地图片</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setUrlOpen((value) => !value)
            setUrlValue('')
          }}
          className={[
            'flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border transition',
            urlOpen
              ? 'border-white/30 bg-white/15 text-white shadow-lg'
              : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10 hover:text-white/85',
          ].join(' ')}
        >
          <Link className="h-4 w-4" />
          <span className="text-xs font-medium">在线链接</span>
        </button>
        <button
          type="button"
          onClick={() => applyBing()}
          className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 text-white/60 transition hover:border-white/20 hover:bg-white/10 hover:text-white/85"
        >
          <Globe className="h-4 w-4" />
          <span className="text-xs font-medium">Bing 每日图像</span>
        </button>
      </div>

      {urlOpen && (
        <div className="mt-3 flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-3">
          <input
            type="text"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyUrlInput()
            }}
            placeholder="输入图片URL..."
            autoFocus
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/25 focus:outline-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setUrlOpen(false)
                setUrlValue('')
              }}
              className="flex-1 rounded-xl px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/10"
            >
              取消
            </button>
            <button
              type="button"
              onClick={applyUrlInput}
              disabled={!urlValue.trim()}
              className="flex-1 rounded-xl bg-white/10 px-3 py-1.5 text-xs text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              应用
            </button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}

function WidgetSettingsSection({ entry }: { entry: SettingsEntry }) {
  const { settings, setSetting } = useWidgetSettings(entry.key)
  const plugin = pluginById[entry.key]

  if (plugin?.settingsComponent) {
    const SettingsComponent = plugin.settingsComponent
    return <SettingsComponent />
  }

  const schema = entry.schema
  if (!schema) {
    return <p className="text-sm text-white/50">没有可配置的选项。</p>
  }
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
