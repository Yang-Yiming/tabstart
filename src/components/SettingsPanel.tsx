import {
  Clock3,
  Folder,
  Globe,
  LayoutGrid,
  Link,
  Monitor,
  Moon,
  Palette,
  Search,
  Settings,
  SlidersHorizontal,
  Sun,
  Upload,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  CLOCK_LOCALE_OPTIONS,
  CLOCK_SETTINGS_KEY,
  DEFAULT_CLOCK_SETTINGS,
  formatShortcut,
  normalizeClockSettings,
  SEARCH_SETTINGS_KEY,
  DEFAULT_SEARCH_SETTINGS,
  normalizeSearchSettings,
  type ClockSettings,
  type SearchEngineShortcut,
  type SearchSettings,
} from '../config/preferences'
import {
  DEFAULT_SEARCH_ENGINE,
  SEARCH_ENGINE_ORDER,
  SEARCH_ENGINES,
  SEARCH_ENGINE_STORAGE_KEY,
  type SearchEngineKey,
} from '../config/search'
import type { ThemeMode } from '../config/theme'
import type { BackgroundControls } from '../hooks/useBackground'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useActiveTheme, useWidgets } from '../plugins/hooks'
import { groupWidgets, useEnabledPlugins } from '../plugins/registry'
import { useWidgetSettings } from '../plugins/widgetSettings'
import type { WidgetSettingsSchema } from '../plugins/types'
import { SettingField } from './SettingField'
import { Toggle } from './Toggle'

interface SettingsPanelProps {
  theme: ThemeMode
  onThemeChange: (theme: ThemeMode) => void
  background: BackgroundControls
}

interface Category {
  id: 'general' | 'appearance' | 'widgets'
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
  { id: 'general', name: 'General', icon: <SlidersHorizontal className="h-4 w-4" /> },
  { id: 'appearance', name: 'Appearance', icon: <Palette className="h-4 w-4" /> },
  { id: 'widgets', name: 'Widgets', icon: <LayoutGrid className="h-4 w-4" /> },
]

export function SettingsPanel({ theme, onThemeChange, background }: SettingsPanelProps) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<'general' | 'appearance' | 'widgets'>('general')
  const [widgetsOpen, setWidgetsOpen] = useState(false)
  const [activeWidgetKey, setActiveWidgetKey] = useState<string | null>(null)

  const { isEnabled } = useEnabledPlugins()
  const widgets = useWidgets()

  const sidebarGroups = useMemo<SidebarGroup[]>(() => {
    const withSettings = widgets.filter(
      (widget) => isEnabled(widget.id) && (widget.settings || widget.settingsComponent),
    )
    return groupWidgets(withSettings).map((group) => ({
      groupName: group.name,
      entries: group.plugins.map((widget) => ({
        key: widget.id,
        groupName: group.name,
        label: widget.name,
        schema: widget.settings ?? null,
      })),
    }))
  }, [isEnabled, widgets])

  const activeEntry = useMemo(
    () => sidebarGroups.flatMap((group) => group.entries).find((entry) => entry.key === activeWidgetKey) ?? null,
    [sidebarGroups, activeWidgetKey],
  )

  const selectCategory = (id: 'general' | 'appearance' | 'widgets') => {
    if (id === 'widgets') {
      if (active === 'widgets') {
        setActive('appearance')
        setWidgetsOpen(false)
      } else {
        setActive('widgets')
        setWidgetsOpen(true)
      }
    } else {
      setActive(id)
      setWidgetsOpen(false)
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

  const headerTitle =
    active === 'general' ? 'General' : active === 'appearance' ? 'Appearance' : (activeEntry?.label ?? 'Widgets')

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="chrome-button rounded-full border p-2.5 shadow-lg transition"
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
            className="absolute left-1/2 top-1/2 flex h-[620px] w-[780px] max-h-[85vh] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border chrome-panel shadow-2xl"
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
                {active === 'general' ? (
                  <GeneralSection />
                ) : active === 'appearance' ? (
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

function GeneralSection() {
  return (
    <>
      <ClockSection />
      <SearchSection />
    </>
  )
}

function ClockSection() {
  const [rawSettings, setSettings] = useLocalStorage<ClockSettings>(CLOCK_SETTINGS_KEY, DEFAULT_CLOCK_SETTINGS)
  const settings = normalizeClockSettings(rawSettings)

  const update = (patch: Partial<ClockSettings>) => {
    setSettings((prev) => ({
      ...DEFAULT_CLOCK_SETTINGS,
      ...normalizeClockSettings(prev),
      ...patch,
    }))
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <Clock3 className="h-4 w-4 text-white/70" />
        <h4 className="text-sm font-medium text-white">时钟</h4>
      </div>
      <p className="mt-1 text-xs text-white/50">个性化主页顶部的时间显示。</p>

      <div className="mt-4 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <ToggleRow
          label="12 小时制"
          description="关闭时使用 24 小时制显示时间。"
          checked={settings.hour12}
          onChange={(value) => update({ hour12: value })}
        />
        <ToggleRow
          label="显示秒数"
          description="在时间中显示秒。"
          checked={settings.showSeconds}
          onChange={(value) => update({ showSeconds: value })}
        />
        <ToggleRow
          label="显示日期"
          description="在时间下方显示日期与星期。"
          checked={settings.showDate}
          onChange={(value) => update({ showDate: value })}
        />
        <div className="flex items-center justify-between gap-6">
          <div>
            <h5 className="text-sm font-medium text-white">语言 / 地区</h5>
            <p className="mt-0.5 text-xs leading-5 text-white/50">控制日期和时间的格式化方式。</p>
          </div>
          <select
            value={settings.locale}
            onChange={(event) => update({ locale: event.target.value })}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none transition focus:border-white/25"
          >
            {CLOCK_LOCALE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

function SearchSection() {
  const [engineKey, setEngineKey] = useLocalStorage<string>(
    SEARCH_ENGINE_STORAGE_KEY,
    DEFAULT_SEARCH_ENGINE,
  )
  const [rawSettings, setSettings] = useLocalStorage<SearchSettings>(SEARCH_SETTINGS_KEY, DEFAULT_SEARCH_SETTINGS)
  const settings = useMemo(() => normalizeSearchSettings(rawSettings), [rawSettings])
  const enabledEngines = settings.enabledEngines
  const [recordingKey, setRecordingKey] = useState<SearchEngineKey | null>(null)
  const [shortcutError, setShortcutError] = useState<string | null>(null)

  const currentEngine: SearchEngineKey = enabledEngines.includes(engineKey as SearchEngineKey)
    ? (engineKey as SearchEngineKey)
    : enabledEngines[0]

  const toggleEngine = (key: SearchEngineKey, enabled: boolean) => {
    const current = normalizeSearchSettings(rawSettings).enabledEngines

    if (!enabled && key === currentEngine && current.length > 1) {
      setEngineKey(current.filter((item) => item !== key)[0])
    }

    setSettings((prev) => {
      const previous = normalizeSearchSettings(prev)
      if (enabled) {
        if (previous.enabledEngines.includes(key)) return prev
        return {
          ...previous,
          enabledEngines: SEARCH_ENGINE_ORDER.filter(
            (item) => item === key || previous.enabledEngines.includes(item),
          ),
        }
      }
      if (previous.enabledEngines.length <= 1 || !previous.enabledEngines.includes(key)) return prev
      return {
        ...previous,
        enabledEngines: previous.enabledEngines.filter((item) => item !== key),
      }
    })
  }

  const updateShortcut = useCallback(
    (key: SearchEngineKey, shortcut: SearchEngineShortcut | null) => {
      setSettings((prev) => {
        const normalized = normalizeSearchSettings(prev)
        return {
          ...normalized,
          shortcuts: {
            ...normalized.shortcuts,
            [key]: shortcut,
          },
        }
      })
    },
    [setSettings],
  )

  useEffect(() => {
    if (!recordingKey) return

    const onKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (e.key === 'Escape') {
        setRecordingKey(null)
        setShortcutError(null)
        return
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        updateShortcut(recordingKey, null)
        setRecordingKey(null)
        setShortcutError(null)
        return
      }

      if (e.key === 'Meta' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Shift' || e.key === 'CapsLock') {
        return
      }

      const shortcut: SearchEngineShortcut = {
        key: e.key.length === 1 ? e.key.toLowerCase() : e.key,
        mod: e.metaKey || e.ctrlKey,
        alt: e.altKey,
        shift: e.shiftKey,
      }

      if (!shortcut.mod && !shortcut.alt && !shortcut.shift) {
        setShortcutError('快捷键需要包含 ⌘/Ctrl、Alt 或 Shift。')
        return
      }

      if (shortcut.mod && !shortcut.alt && !shortcut.shift && shortcut.key.toLowerCase() === 'k') {
        setShortcutError('⌘K / Ctrl+K 已保留用于聚焦搜索栏。')
        return
      }

      const duplicate = SEARCH_ENGINE_ORDER.find((key) => {
        if (key === recordingKey) return false
        const existing = settings.shortcuts[key]
        if (!existing) return false
        return (
          existing.key.toLowerCase() === shortcut.key.toLowerCase() &&
          existing.mod === shortcut.mod &&
          existing.alt === shortcut.alt &&
          existing.shift === shortcut.shift
        )
      })

      if (duplicate) {
        setShortcutError(`快捷键已被 ${SEARCH_ENGINES[duplicate].name} 使用。`)
        return
      }

      updateShortcut(recordingKey, shortcut)
      setRecordingKey(null)
      setShortcutError(null)
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [recordingKey, settings.shortcuts, updateShortcut])

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-white/70" />
        <h4 className="text-sm font-medium text-white">搜索栏</h4>
      </div>
      <p className="mt-1 text-xs text-white/50">选择默认搜索引擎、显示的引擎，以及每个引擎的快捷键。</p>

      <div className="mt-4 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-6">
          <div>
            <h5 className="text-sm font-medium text-white">默认搜索引擎</h5>
            <p className="mt-0.5 text-xs leading-5 text-white/50">按回车键或 ⌘K 后使用的搜索引擎。</p>
          </div>
          <select
            value={currentEngine}
            onChange={(event) => setEngineKey(event.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none transition focus:border-white/25"
          >
            {enabledEngines.map((key) => (
              <option key={key} value={key}>
                {SEARCH_ENGINES[key].name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <h5 className="text-sm font-medium text-white">显示的搜索引擎</h5>
          <p className="mt-0.5 text-xs leading-5 text-white/50">勾选后，该引擎会出现在搜索栏左侧的切换菜单中。</p>
          <div className="mt-3 flex flex-col gap-1">
            {SEARCH_ENGINE_ORDER.map((key) => {
              const checked = enabledEngines.includes(key)
              return (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-xl px-3 py-2 transition hover:bg-white/5"
                >
                  <span className="text-sm text-white/85">{SEARCH_ENGINES[key].name}</span>
                  <Toggle checked={checked} onChange={(value) => toggleEngine(key, value)} />
                </div>
              )
            })}
          </div>
        </div>

        <div className="border-t border-white/10 pt-4">
          <h5 className="text-sm font-medium text-white">搜索引擎快捷键</h5>
          <p className="mt-0.5 text-xs leading-5 text-white/50">
            点击快捷键后按下新的组合键；Esc 取消，Backspace 清除。
          </p>
          <div className="mt-3 flex flex-col gap-1">
            {SEARCH_ENGINE_ORDER.map((key) => {
              const shortcut = settings.shortcuts[key] ?? null
              const recording = recordingKey === key
              return (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-xl px-3 py-2 transition hover:bg-white/5"
                >
                  <span className="text-sm text-white/85">{SEARCH_ENGINES[key].name}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (recording) {
                          setRecordingKey(null)
                          setShortcutError(null)
                        } else {
                          setRecordingKey(key)
                          setShortcutError(null)
                        }
                      }}
                      className={[
                        'min-w-24 rounded-lg border px-3 py-1.5 text-xs font-medium transition',
                        recording
                          ? 'border-sky-300/30 bg-sky-400/10 text-sky-100'
                          : shortcut
                            ? 'border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10'
                            : 'border-dashed border-white/15 bg-transparent text-white/40 hover:border-white/25 hover:text-white/70',
                      ].join(' ')}
                    >
                      {recording ? '按下组合键...' : shortcut ? formatShortcut(shortcut) : '点击录制'}
                    </button>
                    {shortcut && !recording && (
                      <button
                        type="button"
                        onClick={() => updateShortcut(key, null)}
                        className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white/80"
                        aria-label={`清除 ${SEARCH_ENGINES[key].name} 的快捷键`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          {shortcutError && <p className="mt-2 text-xs text-amber-300/80">{shortcutError}</p>}
        </div>
      </div>
    </div>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div>
        <h5 className="text-sm font-medium text-white">{label}</h5>
        <p className="mt-0.5 text-xs leading-5 text-white/50">{description}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
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
  const { themes, activeThemeId, setActiveThemeId } = useActiveTheme()

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

      <div className="mt-8">
        <div>
          <h4 className="text-sm font-medium text-white">插件主题</h4>
          <p className="mt-1 text-xs text-white/50">选择由插件注册的整页视觉主题。</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2" role="radiogroup" aria-label="插件主题">
          <button
            type="button"
            role="radio"
            aria-checked={activeThemeId === 'default'}
            onClick={() => setActiveThemeId('default')}
            className={[
              'flex min-h-16 flex-col justify-between rounded-2xl border p-3 text-left transition',
              activeThemeId === 'default'
                ? 'border-white/30 bg-white/15 text-white shadow-lg'
                : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10 hover:text-white/85',
            ].join(' ')}
          >
            <span className="text-sm font-medium">Default</span>
            <span className="mt-0.5 block text-[10px] leading-4 text-white/45">项目默认玻璃风格</span>
          </button>

          {themes.map((item) => {
            const selected = activeThemeId === item.id
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setActiveThemeId(item.id)}
                className={[
                  'flex min-h-16 flex-col justify-between rounded-2xl border p-3 text-left transition',
                  selected
                    ? 'border-white/30 bg-white/15 text-white shadow-lg'
                    : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20 hover:bg-white/10 hover:text-white/85',
                ].join(' ')}
              >
                <span className="text-sm font-medium">{item.name}</span>
                {item.description && (
                  <span className="mt-0.5 block text-[10px] leading-4 text-white/45">{item.description}</span>
                )}
              </button>
            )
          })}
        </div>
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
  const widgets = useWidgets()
  const widget = widgets.find((item) => item.id === entry.key)

  if (widget?.settingsComponent) {
    const SettingsComponent = widget.settingsComponent
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
