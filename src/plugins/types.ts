import type { ComponentType, HTMLAttributes } from 'react'

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
 * A grid widget contributed by a plugin. Static metadata (id, sizes, schema)
 * is also used by the dashboard to canonicalize stored layouts even while a
 * plugin is disabled.
 */
export interface WidgetDescriptor {
  /** Stable widget id, e.g. `deepseek` / `kanban-compact`. Also the layout & settings key. */
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
  /**
   * Widget id rendered when this instance is expanded into the large centered
   * panel (e.g. `kanban-compact` → `kanban-full`). The target must be another
   * registered widget id; both share the same data store, so grid and expanded
   * views stay in sync. The expanded instance reuses the source widgetKey.
   */
  expandTo?: string
  /**
   * Alternative to `expandTo`: a bespoke component for the expanded panel,
   * for widgets that don't map onto an existing large variant. Takes
   * precedence over `expandTo` when both are set.
   */
  expandedComponent?: ComponentType<WidgetProps>
}

/** A UI slot contributed by a plugin (topbar action, settings section, shell overlay...). */
export interface SlotDescriptor {
  id: string
  slot: string
  component: ComponentType
  label?: string | (() => string)
  order?: number
}

/** A theme contributed by a plugin. Exactly one theme is active at a time. */
export interface ThemeDescriptor {
  id: string
  name: string
  description?: string
  /** Class applied to the document root while the theme is active. */
  rootClass?: string
  /** CSS custom properties applied to the document root while active. */
  tokens?: Record<string, string>
  /** Optional stylesheet text injected while the theme is active. */
  css?: string
  /**
   * Optional React component used to render glass surfaces while this theme
   * is active. It receives normal HTMLDivElement props (className, style,
   * event handlers, children).
   */
  surface?: ComponentType<HTMLAttributes<HTMLDivElement>>
}
