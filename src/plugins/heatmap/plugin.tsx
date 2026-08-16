import { lazy } from 'react'
import { defineWidgetPlugin } from '../runtime'
import type { WidgetDescriptor } from '../types'
import { HeatmapSettings } from './HeatmapSettings'

const widget: WidgetDescriptor = {
  id: 'heatmap',
  name: 'Heatmap',
  group: 'Heatmap',
  component: lazy(() => import('./HeatmapWidget').then((m) => ({ default: m.HeatmapWidget }))),
  settingsComponent: HeatmapSettings,
  defaultW: 4,
  defaultH: 2,
  minW: 3,
  minH: 2,
  builtin: true,
  order: 30,
}

export const plugins = [defineWidgetPlugin(widget)]
