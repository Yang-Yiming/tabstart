export {
  pluginDescriptors,
  pluginById,
  allWidgets,
  widgetById,
  canonicalKey,
  resolveWidget,
  groupWidgets,
  legacyKeysFor,
  useEnabledPlugins,
  migratePluginKeys,
  type WidgetGroup,
} from '../plugins/registry'
export { useWidgetSettings, WIDGET_SETTINGS_KEY } from '../plugins/widgetSettings'
export {
  defineWidgetPlugin,
  type HomepageContext,
  type HomepagePlugin,
  type PluginFiber,
} from '../plugins/runtime'
export type {
  SlotDescriptor,
  ThemeDescriptor,
  WidgetDescriptor,
  WidgetProps,
  WidgetSettingsSchema,
  WidgetSettingField,
} from '../plugins/types'
export type { WidgetSettings, WidgetSettingsState, WidgetSettingValue } from '../plugins/widgetSettings'
