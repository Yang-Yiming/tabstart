/* oxlint-disable react/only-export-components */
import { lazy } from 'react'
import type { WidgetPlugin } from '../types'

const pomodoroCompact: WidgetPlugin = {
  id: 'pomodoro-compact',
  name: 'Pomodoro (Small)',
  group: 'Pomodoro',
  component: lazy(() => import('./PomodoroWidget').then((m) => ({ default: m.PomodoroCompactWidget }))),
  defaultW: 1,
  defaultH: 1,
  minW: 1,
  minH: 1,
  builtin: true,
  order: 70,
}

const pomodoroLarge: WidgetPlugin = {
  id: 'pomodoro-large',
  name: 'Pomodoro (Large)',
  group: 'Pomodoro',
  component: lazy(() => import('./PomodoroWidget').then((m) => ({ default: m.PomodoroLargeWidget }))),
  defaultW: 2,
  defaultH: 2,
  minW: 2,
  minH: 2,
  builtin: true,
  order: 71,
}

export default [pomodoroCompact, pomodoroLarge]
