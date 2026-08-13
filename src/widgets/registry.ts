import { lazy } from 'react'
import { gaugePresets, gaugeSettingsSchema } from './queryPresets'
import type { ResolvedVariant, WidgetGroup, WidgetId } from './types'

const PomodoroCompact = lazy(() =>
  import('./PomodoroWidget').then((m) => ({ default: m.PomodoroCompactWidget })),
)
const PomodoroLarge = lazy(() =>
  import('./PomodoroWidget').then((m) => ({ default: m.PomodoroLargeWidget })),
)
const Bookmarks = lazy(() => import('./BookmarksWidget').then((m) => ({ default: m.BookmarksWidget })))
const Notes = lazy(() => import('./NotesWidget').then((m) => ({ default: m.NotesWidget })))
const Heatmap = lazy(() => import('./HeatmapWidget').then((m) => ({ default: m.HeatmapWidget })))
const Streak = lazy(() => import('./StreakWidget').then((m) => ({ default: m.StreakWidget })))
const Todo = lazy(() => import('./TodoWidget').then((m) => ({ default: m.TodoWidget })))
const KanbanFull = lazy(() => import('./KanbanWidget').then((m) => ({ default: m.KanbanFullWidget })))
const KanbanCompact = lazy(() => import('./KanbanWidget').then((m) => ({ default: m.KanbanCompactWidget })))
const Gauge = lazy(() => import('./QueryWidget').then((m) => ({ default: m.GaugeWidget })))

export const widgetGroups: WidgetGroup[] = [
  {
    id: 'bookmarks',
    name: 'Bookmarks',
    variants: [{ id: 'default', label: 'Bookmarks', component: Bookmarks, defaultW: 2, defaultH: 2, minW: 2, minH: 2 }],
  },
  {
    id: 'notes',
    name: 'Quick Notes',
    variants: [{ id: 'default', label: 'Notes', component: Notes, defaultW: 2, defaultH: 2, minW: 2, minH: 2 }],
  },
  {
    id: 'heatmap',
    name: 'Heatmap',
    variants: [{ id: 'default', label: 'Heatmap', component: Heatmap, defaultW: 4, defaultH: 2, minW: 3, minH: 2 }],
  },
  {
    id: 'streak',
    name: 'Streak',
    variants: [{ id: 'default', label: 'Streak', component: Streak, defaultW: 1, defaultH: 1, minW: 1, minH: 1 }],
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
  },
  {
    id: 'todo',
    name: 'Tasks',
    variants: [{ id: 'default', label: 'Today', component: Todo, defaultW: 2, defaultH: 2, minW: 2, minH: 2 }],
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
  },
  {
    id: 'pomodoro',
    name: 'Pomodoro',
    variants: [
      { id: 'compact', label: 'Small', component: PomodoroCompact, defaultW: 1, defaultH: 1, minW: 1, minH: 1 },
      { id: 'large', label: 'Large', component: PomodoroLarge, defaultW: 2, defaultH: 2, minW: 2, minH: 2 },
    ],
  },
  {
    id: 'kanban',
    name: 'Kanban',
    variants: [
      { id: 'full', label: 'Board', component: KanbanFull, defaultW: 4, defaultH: 3, minW: 2, minH: 2 },
      { id: 'compact', label: 'Compact', component: KanbanCompact, defaultW: 2, defaultH: 2, minW: 2, minH: 2 },
    ],
  },
  {
    id: 'gauge',
    name: 'Gauge',
    variants: gaugePresets.map((preset) => ({
      id: preset.id,
      label: preset.label,
      component: Gauge,
      defaultW: preset.defaultW,
      defaultH: preset.defaultH,
      minW: preset.minW,
      minH: preset.minH,
      settings: gaugeSettingsSchema(preset.config, { minimal: preset.minimalSettings }),
    })),
  },
]

const groupById: Record<string, WidgetGroup> = Object.fromEntries(
  widgetGroups.map((group) => [group.id, group]),
)

export function variantKey(widgetId: WidgetId, variantId: string): string {
  const group = groupById[widgetId]
  if (group && group.variants.length === 1) return widgetId
  return `${widgetId}:${variantId}`
}

export const variantByKey: Record<string, ResolvedVariant> = (() => {
  const map: Record<string, ResolvedVariant> = {}
  for (const group of widgetGroups) {
    for (const variant of group.variants) {
      const key = variantKey(group.id, variant.id)
      map[key] = {
        key,
        widgetId: group.id,
        variantId: variant.id,
        groupName: group.name,
        label: variant.label,
        component: variant.component,
        defaultW: variant.defaultW,
        defaultH: variant.defaultH,
        minW: variant.minW ?? 1,
        minH: variant.minH ?? 1,
        settings: variant.settings ?? group.settings,
      }
    }
  }
  return map
})()

const LEGACY_KEYS: Record<string, string> = {
  pomodoro: 'pomodoro:compact',
}

export function resolveVariant(key: string): ResolvedVariant | undefined {
  return variantByKey[key] ?? variantByKey[LEGACY_KEYS[key] ?? '']
}

export function canonicalKey(key: string): string {
  if (variantByKey[key]) return key
  const legacy = LEGACY_KEYS[key]
  return legacy && variantByKey[legacy] ? legacy : key
}
