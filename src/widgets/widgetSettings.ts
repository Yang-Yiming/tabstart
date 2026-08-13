import { useLocalStorage } from '../hooks/useLocalStorage'
import { canonicalKey, variantByKey } from './registry'
import type { WidgetSettingValue } from './types'

export const WIDGET_SETTINGS_KEY = 'homepage-widget-settings-v1'

export type WidgetSettings = Record<string, WidgetSettingValue>
export type WidgetSettingsState = Record<string, WidgetSettings>

export type { WidgetSettingValue } from './types'

/**
 * Resolve the settings schema for a widget instance key.
 * Schema is looked up per variant first, falling back to the group.
 */
export function widgetSettingsSchema(widgetKey: string) {
  return variantByKey[canonicalKey(widgetKey)]?.settings ?? null
}

export function widgetSettingsDefaults(widgetKey: string): WidgetSettings {
  const schema = widgetSettingsSchema(widgetKey)
  if (!schema) return {}
  return Object.fromEntries(schema.fields.map((field) => [field.key, field.default]))
}

/**
 * Per-instance widget settings, keyed by the resolved variant key
 * (e.g. `gauge:deepseek-balance`). Single-variant groups keep using the
 * group id, so existing stored settings remain compatible.
 */
export function useWidgetSettings(widgetKey: string) {
  const [state, setState] = useLocalStorage<WidgetSettingsState>(WIDGET_SETTINGS_KEY, {})
  const settings: WidgetSettings = { ...widgetSettingsDefaults(widgetKey), ...(state[widgetKey] ?? {}) }

  const setSetting = (key: string, value: WidgetSettingValue) => {
    setState((prev) => ({
      ...prev,
      [widgetKey]: { ...(prev[widgetKey] ?? {}), [key]: value },
    }))
  }

  return { settings, setSetting }
}
