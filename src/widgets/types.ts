import type { ElementType } from 'react'

export type WidgetId = 'clock' | 'search' | 'bookmarks' | 'notes' | 'pomodoro' | 'heatmap' | 'streak'

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

export interface WidgetGroup {
  id: WidgetId
  name: string
  variants: WidgetVariant[]
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
