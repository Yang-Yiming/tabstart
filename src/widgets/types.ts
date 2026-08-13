import type { ElementType } from 'react'

export type WidgetId =
  | 'clock'
  | 'search'
  | 'bookmarks'
  | 'notes'
  | 'pomodoro'
  | 'heatmap'
  | 'streak'
  | 'todo'
  | 'kanban'
  | 'gauge'

export interface WidgetProps {
  className?: string
  /** Resolved variant key of this widget instance, e.g. `gauge:deepseek-balance`. */
  widgetKey?: string
  /** Render in the Add-Widget preview with placeholder data instead of live fetching. */
  preview?: boolean
  /** Rendered at a minimal grid size (single row) — use a denser layout. */
  compact?: boolean
}

export interface WidgetVariant {
  id: string
  label: string
  component: ElementType
  defaultW: number
  defaultH: number
  minW?: number
  minH?: number
  /** Per-variant settings schema (used by presets that share a group). */
  settings?: WidgetSettingsSchema
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

export interface WidgetGroup {
  id: WidgetId
  name: string
  variants: WidgetVariant[]
  settings?: WidgetSettingsSchema
}

export interface ResolvedVariant {
  key: string
  widgetId: WidgetId
  variantId: string
  groupName: string
  label: string
  component: ElementType
  defaultW: number
  defaultH: number
  minW: number
  minH: number
  settings?: WidgetSettingsSchema
}
