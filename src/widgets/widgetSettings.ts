import { useLocalStorage } from '../hooks/useLocalStorage'
import { widgetGroups } from './registry'

export const WIDGET_SETTINGS_KEY = 'homepage-widget-settings-v1'

export type WidgetSettingValue = boolean | string | number
export type WidgetSettings = Record<string, WidgetSettingValue>
export type WidgetSettingsState = Record<string, WidgetSettings>

export function widgetSettingsSchema(widgetId: string) {
  return widgetGroups.find((group) => group.id === widgetId)?.settings ?? null
}

export function widgetSettingsDefaults(widgetId: string): WidgetSettings {
  const schema = widgetSettingsSchema(widgetId)
  if (!schema) return {}
  return Object.fromEntries(schema.fields.map((field) => [field.key, field.default]))
}

export function useWidgetSettings(widgetId: string) {
  const [state, setState] = useLocalStorage<WidgetSettingsState>(WIDGET_SETTINGS_KEY, {})
  const settings: WidgetSettings = { ...widgetSettingsDefaults(widgetId), ...(state[widgetId] ?? {}) }

  const setSetting = (key: string, value: WidgetSettingValue) => {
    setState((prev) => ({
      ...prev,
      [widgetId]: { ...(prev[widgetId] ?? {}), [key]: value },
    }))
  }

  return { settings, setSetting }
}
