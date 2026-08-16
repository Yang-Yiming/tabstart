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

export interface SearchSettings {
  /**
   * Engines shown in the search widget, in display order.
   * Stored as a list of enabled engine keys (canonical order).
   */
  enabledEngines: SearchEngineKey[]
}

export const DEFAULT_SEARCH_SETTINGS: SearchSettings = {
  enabledEngines: [...SEARCH_ENGINE_ORDER],
}

/** Normalize persisted search settings and always return at least one enabled engine. */
export function normalizeSearchSettings(settings: SearchSettings | null | undefined): SearchSettings {
  const raw = settings?.enabledEngines
  const enabledEngines = Array.isArray(raw)
    ? SEARCH_ENGINE_ORDER.filter((key) => raw.includes(key))
    : []

  if (enabledEngines.length === 0) {
    return { enabledEngines: [...DEFAULT_SEARCH_SETTINGS.enabledEngines] }
  }

  return { enabledEngines }
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
