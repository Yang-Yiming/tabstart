import type { ComponentType } from 'react'
import type { WidgetId } from './types'
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
}
