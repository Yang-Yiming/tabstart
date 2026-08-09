import type { ElementType } from 'react'

export type WidgetId = 'clock' | 'search' | 'bookmarks' | 'notes' | 'pomodoro' | 'heatmap' | 'streak' | 'todo'

export interface WidgetProps {
  className?: string
}

export interface WidgetVariant {
  id: string
  label: string
  component: ElementType
  defaultW: number
  defaultH: number
  minW?: number
  minH?: number
}

export type WidgetSettingField =
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

export interface WidgetGroup {
  id: WidgetId
  name: string
  variants: WidgetVariant[]
  settings?: {
    title: string
    description?: string
    fields: WidgetSettingField[]
  }
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
}
