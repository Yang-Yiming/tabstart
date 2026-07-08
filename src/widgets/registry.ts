import { lazy, type ElementType } from 'react'
import type { WidgetId, WidgetMeta } from './types'

export const widgetRegistry: Record<WidgetId, ElementType> = {
  clock: lazy(() => import('./ClockWidget').then((module) => ({ default: module.ClockWidget }))),
  search: lazy(() => import('./SearchWidget').then((module) => ({ default: module.SearchWidget }))),
  bookmarks: lazy(() => import('./BookmarksWidget').then((module) => ({ default: module.BookmarksWidget }))),
  notes: lazy(() => import('./NotesWidget').then((module) => ({ default: module.NotesWidget }))),
  pomodoro: lazy(() => import('./PomodoroWidget').then((module) => ({ default: module.PomodoroWidget }))),
  weather: lazy(() => import('./WeatherWidget').then((module) => ({ default: module.WeatherWidget }))),
  heatmap: lazy(() => import('./HeatmapWidget').then((module) => ({ default: module.HeatmapWidget }))),
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
