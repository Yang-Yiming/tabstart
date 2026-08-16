import { lazy } from 'react'
import { defineWidgetPlugin } from '../runtime'
import type { WidgetDescriptor } from '../types'

const widget: WidgetDescriptor = {
  id: 'bookmarks',
  name: 'Bookmarks',
  group: 'Bookmarks',
  component: lazy(() => import('./BookmarksWidget').then((m) => ({ default: m.BookmarksWidget }))),
  defaultW: 2,
  defaultH: 2,
  minW: 2,
  minH: 2,
  builtin: true,
  order: 10,
}

export const plugins = [defineWidgetPlugin(widget)]
