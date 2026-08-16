import { lazy } from 'react'
import { defineWidgetPlugin } from '../runtime'
import type { WidgetDescriptor } from '../types'

const widget: WidgetDescriptor = {
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

export const plugins = [defineWidgetPlugin(widget)]
