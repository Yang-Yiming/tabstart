export {
  plugins,
  pluginById,
  canonicalKey,
  resolvePlugin,
  groupPlugins,
  legacyKeysFor,
  useEnabledPlugins,
  migratePluginKeys,
  type PluginGroup,
} from '../plugins/registry'
export {
  useWidgetSettings,
  widgetSettingsSchema,
  widgetSettingsDefaults,
  WIDGET_SETTINGS_KEY,
} from '../plugins/widgetSettings'
export type { WidgetPlugin, WidgetProps, WidgetSettingsSchema, WidgetSettingField } from '../plugins/types'
export type { WidgetSettings, WidgetSettingsState, WidgetSettingValue } from '../plugins/widgetSettings'
