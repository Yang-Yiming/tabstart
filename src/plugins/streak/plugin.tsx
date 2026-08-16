import { lazy } from 'react'
import { defineWidgetPlugin } from '../runtime'
import type { WidgetDescriptor } from '../types'

const widget: WidgetDescriptor = {
  id: 'streak',
  name: 'Streak',
  group: 'Streak',
  component: lazy(() => import('./StreakWidget').then((m) => ({ default: m.StreakWidget }))),
  defaultW: 1,
  defaultH: 1,
  minW: 1,
  minH: 1,
  builtin: true,
  order: 40,
  settings: {
    title: 'Streak',
    description: '连胜与连败统计。',
    fields: [
      {
        type: 'select',
        key: 'bigNumberMode',
        label: '大字显示',
        description: '选择中央大数字展示的内容：自动模式下，今天和昨天都未完成目标时显示连败，否则显示连胜。',
        options: [
          { value: 'auto', label: '连胜 & 连败（自动）' },
          { value: 'win', label: '连胜' },
          { value: 'loss', label: '连败' },
        ],
        default: 'auto',
      },
      {
        type: 'boolean',
        key: 'showLosingStreak',
        label: '显示连败统计',
        description: '在底部同时显示连续未完成目标的天数（连败），督促自己完成任务。从未完成过会显示 ∞。',
        default: false,
      },
    ],
  },
}

export const plugins = [defineWidgetPlugin(widget)]
