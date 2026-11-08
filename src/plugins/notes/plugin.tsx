import { lazy } from 'react'
import { defineWidgetPlugin } from '../runtime'
import type { WidgetDescriptor } from '../types'

const widget: WidgetDescriptor = {
  id: 'notes',
  name: 'Quick Notes',
  description: '随手记录短文本，内容自动保存在本地。',
  group: 'Quick Notes',
  component: lazy(() => import('./NotesWidget').then((m) => ({ default: m.NotesWidget }))),
  defaultW: 2,
  defaultH: 2,
  minW: 1,
  minH: 2,
  builtin: true,
  order: 20,
}

export const plugins = [defineWidgetPlugin(widget)]
