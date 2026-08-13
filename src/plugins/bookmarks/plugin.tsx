import { lazy } from 'react'
import type { WidgetPlugin } from '../types'

const plugin: WidgetPlugin = {
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

export default plugin
