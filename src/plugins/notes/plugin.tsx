import { lazy } from 'react'
import type { WidgetPlugin } from '../types'

const plugin: WidgetPlugin = {
  id: 'notes',
  name: 'Quick Notes',
  group: 'Quick Notes',
  component: lazy(() => import('./NotesWidget').then((m) => ({ default: m.NotesWidget }))),
  defaultW: 2,
  defaultH: 2,
  minW: 2,
  minH: 2,
  builtin: true,
  order: 20,
}

export default plugin
