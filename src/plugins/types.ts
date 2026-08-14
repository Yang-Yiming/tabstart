import type { ComponentType } from 'react'

export interface WidgetProps {
  className?: string
  /** Plugin id of this widget instance, e.g. `deepseek`. */
  widgetKey?: string
  /** Render in the Add-Widget preview with placeholder data instead of live fetching. */
  preview?: boolean
  /** Rendered at a minimal grid size (single row) — use a denser layout. */
  compact?: boolean
}

export type WidgetSettingValue = boolean | string | number

export type WidgetSettingField = (
  | { type: 'boolean'; key: string; label: string; description?: string; default: boolean }
  | {
      type: 'select'
      key: string
      label: string
      description?: string
      options: Array<{ value: string; label: string }>
      default: string
    }
  | {
      type: 'number'
      key: string
      label: string
      description?: string
      min?: number
      max?: number
      step?: number
      default: number
    }
  | { type: 'text'; key: string; label: string; description?: string; default: string }
  | {
      type: 'json'
      key: string
      label: string
      description?: string
      default: string
      rows?: number
    }
  | { type: 'password'; key: string; label: string; description?: string; default: string }
) & {
  /** Only show this field while the predicate is true (evaluated against current settings). */
  showWhen?: (settings: Record<string, WidgetSettingValue>) => boolean
}

export interface WidgetSettingsSchema {
  title: string
  description?: string
  fields: WidgetSettingField[]
}

/**
 * A widget plugin. Every grid widget — built-in or user-authored — is a
 * plugin registered under `src/plugins/<id>/plugin.tsx`.
 */
export interface WidgetPlugin {
  /** Stable plugin id, e.g. `deepseek` / `kanban-compact`. Also the layout & settings key. */
  id: string
  /** Display name shown in the picker, settings and plugin manager. */
  name: string
  description?: string
  /** Grouping label in the Add-Widget picker and settings sidebar, e.g. `Kanban`. */
  group?: string
  component: ComponentType<WidgetProps>
  defaultW: number
  defaultH: number
  minW?: number
  minH?: number
  /** Per-plugin settings schema. */
  settings?: WidgetSettingsSchema
  /**
   * Full custom settings UI, rendered inside Settings → Widgets instead of
   * the generic schema fields. Use it for settings that need bespoke
   * controls (lists, steppers, remote state) rather than simple fields.
   */
  settingsComponent?: ComponentType
  /** Mark as a core built-in widget: only disable-able in the plugin manager. */
  builtin?: boolean
  /** Display order inside its group (lower first). */
  order?: number
}
