/* oxlint-disable react/only-export-components */
import { lazy } from 'react'
import { defineWidgetPlugin } from '../runtime'
import type { WidgetDescriptor } from '../types'

const kanbanFull: WidgetDescriptor = {
  id: 'kanban-full',
  name: 'Kanban Board',
  group: 'Kanban',
  component: lazy(() => import('./KanbanWidget').then((m) => ({ default: m.KanbanFullWidget }))),
  defaultW: 4,
  defaultH: 3,
  minW: 2,
  minH: 2,
  builtin: true,
  order: 60,
}

const kanbanCompact: WidgetDescriptor = {
  id: 'kanban-compact',
  name: 'Kanban Compact',
  group: 'Kanban',
  component: lazy(() => import('./KanbanWidget').then((m) => ({ default: m.KanbanCompactWidget }))),
  defaultW: 2,
  defaultH: 2,
  minW: 2,
  minH: 2,
  builtin: true,
  order: 61,
  expandTo: 'kanban-full',
}

export const plugins = [defineWidgetPlugin(kanbanFull), defineWidgetPlugin(kanbanCompact)]
