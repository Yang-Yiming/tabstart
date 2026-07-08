import { lazy } from 'react'
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
  },
  {
    id: 'pomodoro',
    name: 'Pomodoro',
    variants: [
      { id: 'compact', label: 'Small', component: PomodoroCompact, defaultW: 1, defaultH: 1, minW: 1, minH: 1 },
      { id: 'large', label: 'Large', component: PomodoroLarge, defaultW: 2, defaultH: 2, minW: 2, minH: 2 },
    ],
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
