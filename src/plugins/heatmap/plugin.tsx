import { lazy } from 'react'
import type { WidgetPlugin } from '../types'

const plugin: WidgetPlugin = {
  id: 'heatmap',
  name: 'Heatmap',
  group: 'Heatmap',
  component: lazy(() => import('./HeatmapWidget').then((m) => ({ default: m.HeatmapWidget }))),
  defaultW: 4,
  defaultH: 2,
  minW: 3,
  minH: 2,
  builtin: true,
  order: 30,
}

export default plugin
