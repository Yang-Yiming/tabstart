import { SEARCH_ENGINE_ORDER, SEARCH_ENGINES, type SearchEngineKey } from './search'

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

export interface SearchEngineItem {
  id: string
  name: string
  url: string
  builtin: boolean
}

export interface SearchSettings {
  /**
   * Engines shown in the search widget, in display order. Built-in engines
   * are identified by their canonical id; custom engines use a generated id.
   */
  engines: SearchEngineItem[]
  /**
   * Per-engine keyboard shortcuts. An empty array means the engine has no
   * shortcut assigned; missing entries fall back to the engine default.
   */
  shortcuts: Partial<Record<string, SearchEngineShortcut[]>>
}

const BUILTIN_SEARCH_ENGINES: SearchEngineItem[] = SEARCH_ENGINE_ORDER.map((id) => ({
  id,
  name: SEARCH_ENGINES[id].name,
  url: SEARCH_ENGINES[id].url,
  builtin: true,
}))

const DEFAULT_SEARCH_SHORTCUTS: Record<string, SearchEngineShortcut[]> = {
  google: [{ key: '1', mod: true, alt: false, shift: false }],
  bing: [{ key: '2', mod: true, alt: false, shift: false }],
  duckduckgo: [{ key: '3', mod: true, alt: false, shift: false }],
  github: [{ key: '4', mod: true, alt: false, shift: false }],
  alphaxiv: [{ key: '5', mod: true, alt: false, shift: false }],
}

export const DEFAULT_SEARCH_SETTINGS: SearchSettings = {
  engines: BUILTIN_SEARCH_ENGINES.map((engine) => ({ ...engine })),
  shortcuts: Object.fromEntries(
    Object.entries(DEFAULT_SEARCH_SHORTCUTS).map(([id, shortcuts]) => [id, [...shortcuts]]),
  ),
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

export function shortcutEquals(a: SearchEngineShortcut, b: SearchEngineShortcut): boolean {
  return (
    a.key.toLowerCase() === b.key.toLowerCase() &&
    a.mod === b.mod &&
    a.alt === b.alt &&
    a.shift === b.shift
  )
}

function normalizeShortcutArray(value: unknown): SearchEngineShortcut[] | undefined {
  if (value === null || value === undefined) return undefined

  if (Array.isArray(value)) {
    const shortcuts: SearchEngineShortcut[] = []
    for (const item of value) {
      const parsed = normalizeShortcut(item)
      if (parsed && !shortcuts.some((existing) => shortcutEquals(existing, parsed))) {
        shortcuts.push(parsed)
      }
    }
    return shortcuts
  }

  // Migrate the previous single-shortcut object format.
  const parsed = normalizeShortcut(value)
  return parsed ? [parsed] : undefined
}

function normalizeEngineItem(value: unknown): SearchEngineItem | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const id = typeof record.id === 'string' ? record.id.trim() : ''
  const name = typeof record.name === 'string' ? record.name.trim() : ''
  const url = typeof record.url === 'string' ? record.url.trim() : ''
  if (!id || !name || !url) return null
  return {
    id,
    name,
    url,
    builtin: SEARCH_ENGINE_ORDER.includes(id as SearchEngineKey),
  }
}

/**
 * Normalize persisted search settings and always return at least one engine.
 * Also migrates the previous `enabledEngines`-based format on read.
 */
export function normalizeSearchSettings(settings: SearchSettings | null | undefined): SearchSettings {
  const legacy = settings as
    | {
        engines?: unknown
        enabledEngines?: unknown
        shortcuts?: Record<string, unknown> | null
      }
    | null
    | undefined

  let engines: SearchEngineItem[] = []
  if (Array.isArray(legacy?.engines)) {
    const seen = new Set<string>()
    for (const item of legacy.engines) {
      const parsed = normalizeEngineItem(item)
      if (parsed && !seen.has(parsed.id)) {
        seen.add(parsed.id)
        engines.push(parsed)
      }
    }
  }

  // Migrate the old `enabledEngines` list if the new `engines` list is missing.
  if (engines.length === 0 && Array.isArray(legacy?.enabledEngines)) {
    const oldList = legacy.enabledEngines as unknown[]
    engines = SEARCH_ENGINE_ORDER
      .filter((id) => oldList.includes(id))
      .map((id) => ({
        id,
        name: SEARCH_ENGINES[id].name,
        url: SEARCH_ENGINES[id].url,
        builtin: true,
      }))
  }

  if (engines.length === 0) {
    engines = DEFAULT_SEARCH_SETTINGS.engines.map((engine) => ({ ...engine }))
  }

  const shortcuts: SearchSettings['shortcuts'] = {}
  for (const engine of engines) {
    const stored = legacy?.shortcuts?.[engine.id] as unknown
    if (stored === null) {
      // The previous format used null to mean "no shortcut".
      shortcuts[engine.id] = []
    } else {
      const normalized = normalizeShortcutArray(stored)
      shortcuts[engine.id] = normalized ?? (engine.builtin
        ? [...(DEFAULT_SEARCH_SHORTCUTS[engine.id] ?? [])]
        : [])
    }
  }

  return { engines, shortcuts }
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

/** Build a search URL, supporting both prefix-style and OpenSearch `%s` URLs. */
export function buildSearchUrl(url: string, query: string): string {
  const encoded = encodeURIComponent(query)
  if (url.includes('%s')) {
    return url.replace(/%s/g, encoded)
  }
  return url + encoded
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
