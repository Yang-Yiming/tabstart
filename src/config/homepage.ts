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

export interface BackgroundConfig {
  src: string
  overlay: number
  blur?: number
}

export interface HomepageConfig {
  title: string
  background: BackgroundConfig
  widgets: WidgetLayout[]
  search: {
    defaultEngine: string
    engines: Record<string, SearchEngine>
  }
  bookmarks: BookmarkGroup[]
}

export const homepageConfig: HomepageConfig = {
  title: 'Launchpad',
  background: {
    src: '',
    overlay: 0.3,
    blur: 0,
  },
  widgets: [
    { id: 'bookmarks', columnSpan: 2, rowSpan: 2 },
    { id: 'notes', columnSpan: 2, rowSpan: 2 },
    { id: 'heatmap', columnSpan: 4, rowSpan: 2 },
  ],
  search: {
    defaultEngine: 'google',
    engines: {
      google: { name: 'Google', url: 'https://www.google.com/search?q=' },
      bing: { name: 'Bing', url: 'https://www.bing.com/search?q=' },
      duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
      github: { name: 'GitHub', url: 'https://github.com/search?q=' },
      alphaxiv: { name: 'AlphaXiv', url: 'https://www.alphaxiv.org/?query=' },
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
