import { SEARCH_ENGINE_ORDER, type SearchEngineKey } from './search'

export const CLOCK_SETTINGS_KEY = 'homepage-clock-settings-v1'
export const SEARCH_SETTINGS_KEY = 'homepage-search-settings-v1'

export interface ClockSettings {
  /** Use 12-hour time instead of 24-hour time. */
  hour12: boolean
  /** Show seconds on the clock. */
  showSeconds: boolean
  /** Show the date under the clock. */
  showDate: boolean
  /** Locale used for time/date formatting. */
  locale: string
}

export const DEFAULT_CLOCK_SETTINGS: ClockSettings = {
  hour12: false,
  showSeconds: false,
  showDate: true,
  locale: 'zh-CN',
}

export const CLOCK_LOCALE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'zh-CN', label: '中文（中国）' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'ja-JP', label: '日本語' },
  { value: 'ko-KR', label: '한국어' },
  { value: 'de-DE', label: 'Deutsch' },
  { value: 'fr-FR', label: 'Français' },
]

export interface SearchEngineShortcut {
  /** KeyboardEvent.key, normalized to lowercase for single characters. */
  key: string
  /** Primary modifier: Command on macOS, Ctrl on Windows/Linux. */
  mod: boolean
  alt: boolean
  shift: boolean
}

export interface SearchSettings {
  /**
   * Engines shown in the search widget, in display order.
   * Stored as a list of enabled engine keys (canonical order).
   */
  enabledEngines: SearchEngineKey[]
  /**
   * Per-engine keyboard shortcuts. A null value means the engine has no
   * shortcut assigned; undefined keys fall back to the default shortcut.
   */
  shortcuts: Partial<Record<SearchEngineKey, SearchEngineShortcut | null>>
}

const DEFAULT_SEARCH_SHORTCUTS: Record<SearchEngineKey, SearchEngineShortcut> = {
  google: { key: '1', mod: true, alt: false, shift: false },
  bing: { key: '2', mod: true, alt: false, shift: false },
  duckduckgo: { key: '3', mod: true, alt: false, shift: false },
  github: { key: '4', mod: true, alt: false, shift: false },
  alphaxiv: { key: '5', mod: true, alt: false, shift: false },
}

export const DEFAULT_SEARCH_SETTINGS: SearchSettings = {
  enabledEngines: [...SEARCH_ENGINE_ORDER],
  shortcuts: { ...DEFAULT_SEARCH_SHORTCUTS },
}

function normalizeShortcut(value: unknown): SearchEngineShortcut | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const key = typeof record.key === 'string' ? record.key : ''
  if (!key) return null
  const mod = Boolean(record.mod)
  const alt = Boolean(record.alt)
  const shift = Boolean(record.shift)
  // A shortcut without any modifier would fire while typing; require one.
  if (!mod && !alt && !shift) return null
  return { key, mod, alt, shift }
}

/** Normalize persisted search settings and always return at least one enabled engine. */
export function normalizeSearchSettings(settings: SearchSettings | null | undefined): SearchSettings {
  const raw = settings?.enabledEngines
  const enabledEngines = Array.isArray(raw)
    ? SEARCH_ENGINE_ORDER.filter((key) => raw.includes(key))
    : []

  const shortcuts: SearchSettings['shortcuts'] = {}
  for (const key of SEARCH_ENGINE_ORDER) {
    const stored = settings?.shortcuts?.[key]
    if (stored === null) {
      shortcuts[key] = null
    } else {
      shortcuts[key] = normalizeShortcut(stored) ?? DEFAULT_SEARCH_SHORTCUTS[key]
    }
  }

  return {
    enabledEngines: enabledEngines.length === 0 ? [...DEFAULT_SEARCH_SETTINGS.enabledEngines] : enabledEngines,
    shortcuts,
  }
}

const KEY_LABELS: Record<string, string> = {
  ' ': 'Space',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
}

function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Mac|iPhone|iPad/.test(navigator.platform ?? navigator.userAgent ?? '')
}

/** Format a shortcut for display, e.g. `⌘+B` on macOS and `Ctrl+B` elsewhere. */
export function formatShortcut(shortcut: SearchEngineShortcut | null | undefined): string {
  if (!shortcut) return ''
  const mac = isMacPlatform()
  const parts: string[] = []
  if (shortcut.mod) parts.push(mac ? '⌘' : 'Ctrl')
  if (shortcut.alt) parts.push(mac ? '⌥' : 'Alt')
  if (shortcut.shift) parts.push(mac ? '⇧' : 'Shift')
  const keyLabel = shortcut.key.length === 1
    ? (shortcut.key === ' ' ? 'Space' : shortcut.key.toUpperCase())
    : (KEY_LABELS[shortcut.key] ?? shortcut.key)
  parts.push(keyLabel)
  return parts.join('+')
}

/** True when a keyboard event exactly matches a stored shortcut. */
export function shortcutMatches(event: KeyboardEvent, shortcut: SearchEngineShortcut | null | undefined): boolean {
  if (!shortcut) return false
  const primaryMod = event.metaKey || event.ctrlKey
  if (shortcut.mod !== primaryMod) return false
  if (shortcut.alt !== event.altKey) return false
  if (shortcut.shift !== event.shiftKey) return false
  const eventKey = event.key.length === 1 ? event.key.toLowerCase() : event.key
  const shortcutKey = shortcut.key.length === 1 ? shortcut.key.toLowerCase() : shortcut.key
  return eventKey === shortcutKey
}

/** Normalize persisted clock settings so partial stored objects still work. */
export function normalizeClockSettings(settings: ClockSettings | null | undefined): ClockSettings {
  return {
    hour12: settings?.hour12 ?? DEFAULT_CLOCK_SETTINGS.hour12,
    showSeconds: settings?.showSeconds ?? DEFAULT_CLOCK_SETTINGS.showSeconds,
    showDate: settings?.showDate ?? DEFAULT_CLOCK_SETTINGS.showDate,
    locale: settings?.locale || DEFAULT_CLOCK_SETTINGS.locale,
  }
}
