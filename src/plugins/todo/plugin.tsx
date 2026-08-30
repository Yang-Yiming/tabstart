import { lazy } from 'react'
import { defineWidgetPlugin } from '../runtime'
import type { WidgetDescriptor } from '../types'

const widget: WidgetDescriptor = {
  id: 'todo',
  name: 'Tasks',
  group: 'Tasks',
  component: lazy(() => import('./TodoWidget').then((m) => ({ default: m.TodoWidget }))),
  expandedComponent: lazy(() => import('./TodoExpandedWidget').then((m) => ({ default: m.TodoExpandedWidget }))),
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
      {
        type: 'boolean',
        key: 'completedToBottom',
        label: '完成任务自动沉底',
        description: '已完成的任务自动排在列表末尾；列表顺序仍以手动拖动为准。',
        default: true,
      },
    ],
  },
}

export const plugins = [defineWidgetPlugin(widget)]
