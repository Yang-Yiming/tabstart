export type WidgetId = 'clock' | 'search' | 'bookmarks' | 'notes' | 'pomodoro' | 'weather' | 'heatmap'

export interface WidgetProps {
  className?: string
}

export interface WidgetMeta {
  id: WidgetId
  name: string
  defaultW: number
  defaultH: number
  minW?: number
  minH?: number
}
