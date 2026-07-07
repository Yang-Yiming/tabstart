import type { ComponentType } from 'react'
import { HeatmapWidget } from './HeatmapWidget'
import type { WidgetId, WidgetMeta } from './types'
import { ClockWidget } from './ClockWidget'
import { SearchWidget } from './SearchWidget'
import { BookmarksWidget } from './BookmarksWidget'
import { NotesWidget } from './NotesWidget'
import { PomodoroWidget } from './PomodoroWidget'
import { WeatherWidget } from './WeatherWidget'

export const widgetRegistry: Record<WidgetId, ComponentType> = {
  clock: ClockWidget,
  search: SearchWidget,
  bookmarks: BookmarksWidget,
  notes: NotesWidget,
  pomodoro: PomodoroWidget,
  weather: WeatherWidget,
  heatmap: HeatmapWidget,
}

export const widgetMetaList: WidgetMeta[] = [
  { id: 'bookmarks', name: 'Bookmarks', defaultW: 2, defaultH: 2, minW: 2, minH: 2 },
  { id: 'notes', name: 'Quick Notes', defaultW: 2, defaultH: 2, minW: 2, minH: 2 },
  { id: 'heatmap', name: 'Heatmap', defaultW: 4, defaultH: 2, minW: 3, minH: 2 },
  { id: 'pomodoro', name: 'Pomodoro', defaultW: 1, defaultH: 2, minW: 1, minH: 2 },
  { id: 'weather', name: 'Weather', defaultW: 1, defaultH: 2, minW: 1, minH: 2 },
]

export const widgetMetaById: Record<WidgetId, WidgetMeta> = {
  clock: { id: 'clock', name: 'Clock', defaultW: 4, defaultH: 1, minW: 2, minH: 1 },
  search: { id: 'search', name: 'Search', defaultW: 4, defaultH: 1, minW: 2, minH: 1 },
  bookmarks: widgetMetaList[0],
  notes: widgetMetaList[1],
  heatmap: widgetMetaList[2],
  pomodoro: widgetMetaList[3],
  weather: widgetMetaList[4],
}
