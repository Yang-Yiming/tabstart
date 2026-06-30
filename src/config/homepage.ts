import type { WidgetId } from '../widgets/types'

export interface SearchEngine {
  name: string
  url: string
}

export interface BookmarkLink {
  title: string
  url: string
  icon: string
}

export interface BookmarkGroup {
  title: string
  links: BookmarkLink[]
}

export interface WidgetLayout {
  id: WidgetId
  columnSpan?: number
  rowSpan?: number
}

export interface HomepageConfig {
  title: string
  widgets: WidgetLayout[]
  search: {
    defaultEngine: string
    engines: Record<string, SearchEngine>
  }
  bookmarks: BookmarkGroup[]
}

export const homepageConfig: HomepageConfig = {
  title: 'Launchpad',
  widgets: [
    { id: 'clock', columnSpan: 2, rowSpan: 1 },
    { id: 'search', columnSpan: 4, rowSpan: 1 },
    { id: 'heatmap', columnSpan: 4, rowSpan: 2 },
    { id: 'bookmarks', columnSpan: 2, rowSpan: 2 },
    { id: 'notes', columnSpan: 2, rowSpan: 2 },
  ],
  search: {
    defaultEngine: 'google',
    engines: {
      google: { name: 'Google', url: 'https://www.google.com/search?q=' },
      duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
      github: { name: 'GitHub', url: 'https://github.com/search?q=' },
    },
  },
  bookmarks: [
    {
      title: 'Work',
      links: [
        { title: 'Gmail', url: 'https://mail.google.com', icon: 'Mail' },
        { title: 'Calendar', url: 'https://calendar.google.com', icon: 'Calendar' },
        { title: 'GitHub', url: 'https://github.com', icon: 'GitBranch' },
      ],
    },
    {
      title: 'Read',
      links: [
        { title: 'Hacker News', url: 'https://news.ycombinator.com', icon: 'Newspaper' },
        { title: 'MDN', url: 'https://developer.mozilla.org', icon: 'Code' },
      ],
    },
  ],
}
