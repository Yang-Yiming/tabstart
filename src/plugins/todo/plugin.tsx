import { lazy } from 'react'
import { defineWidgetPlugin } from '../runtime'
import type { WidgetDescriptor } from '../types'

const widget: WidgetDescriptor = {
  id: 'todo',
  name: 'Tasks',
  group: 'Tasks',
  component: lazy(() => import('./TodoWidget').then((m) => ({ default: m.TodoWidget }))),
  defaultW: 2,
  defaultH: 2,
  minW: 2,
  minH: 2,
  builtin: true,
  order: 50,
  settings: {
    title: 'Tasks',
    description: 'Manage tasks, goals and how overdue items are handled.',
    fields: [
      {
        type: 'boolean',
        key: 'carryOverOverdue',
        label: '逾期任务顺延到当天',
        description: '未完成的过期任务会自动出现在今天的列表中，直到完成。',
        default: true,
      },
    ],
  },
}

export const plugins = [defineWidgetPlugin(widget)]
