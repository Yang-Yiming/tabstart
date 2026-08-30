/* oxlint-disable react/only-export-components */
import { lazy } from 'react'
import { defineWidgetPlugin } from '../runtime'
import type { WidgetDescriptor } from '../types'

/** Shared by both variants; resolved per instance key via useWidgetSettings. */
const advanceOnCompleteField = {
  type: 'boolean' as const,
  key: 'advanceOnComplete',
  label: '勾选完成时移到 Done 栏',
  description: '开启时点击圆圈会把任务移动到 Done 栏（再次点击移回原栏）；关闭后在原地标记完成，不改变栏位。',
  default: true,
}

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
  settings: {
    title: 'Kanban Board',
    fields: [advanceOnCompleteField],
  },
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
  settings: {
    title: 'Kanban Compact',
    fields: [advanceOnCompleteField],
  },
}

export const plugins = [defineWidgetPlugin(kanbanFull), defineWidgetPlugin(kanbanCompact)]
