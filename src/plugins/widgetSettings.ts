import { useLocalStorage } from '../hooks/useLocalStorage'
import { canonicalKey, legacyKeysFor, pluginById } from './registry'
import type { WidgetSettingValue } from './types'

export const WIDGET_SETTINGS_KEY = 'homepage-widget-settings-v1'

export type WidgetSettings = Record<string, WidgetSettingValue>
export type WidgetSettingsState = Record<string, WidgetSettings>

export type { WidgetSettingValue } from './types'

/**
 * Resolve the settings schema for a widget instance key (a plugin id).
 */
export function widgetSettingsSchema(widgetKey: string) {
  return pluginById[canonicalKey(widgetKey)]?.settings ?? null
}

export function widgetSettingsDefaults(widgetKey: string): WidgetSettings {
  const schema = widgetSettingsSchema(widgetKey)
  if (!schema) return {}
  return Object.fromEntries(schema.fields.map((field) => [field.key, field.default]))
}

/**
 * Stored settings for a plugin, falling back to legacy keys that migrate
 * into this plugin id (e.g. `gauge:deepseek-balance` → `deepseek`) so old
 * data applies even before the one-time storage migration runs.
 */
function storedSettings(state: WidgetSettingsState, widgetKey: string): WidgetSettings | undefined {
  const canonical = canonicalKey(widgetKey)
  if (state[canonical] !== undefined) return state[canonical]
  for (const legacy of legacyKeysFor(canonical)) {
    if (state[legacy] !== undefined) return state[legacy]
  }
  return state[widgetKey]
}

/**
 * Per-plugin settings, keyed by the plugin id (e.g. `deepseek`).
 */
export function useWidgetSettings(widgetKey: string) {
  const [state, setState] = useLocalStorage<WidgetSettingsState>(WIDGET_SETTINGS_KEY, {})
  const canonical = canonicalKey(widgetKey)
  const settings: WidgetSettings = {
    ...widgetSettingsDefaults(canonical),
    ...storedSettings(state, widgetKey),
  }

  const setSetting = (key: string, value: WidgetSettingValue) => {
    setState((prev) => ({
      ...prev,
      [canonical]: { ...(prev[canonical] ?? {}), [key]: value },
    }))
  }

  return { settings, setSetting }
}
