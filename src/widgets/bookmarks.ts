import {
  Calendar,
  Code,
  GitBranch,
  Globe,
  Mail,
  Music,
  Newspaper,
  type LucideIcon,
} from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'

export interface BookmarkLink {
  title: string
  url: string
  icon: string
}

export interface BookmarkGroup {
  title: string
  links: BookmarkLink[]
}

export const BOOKMARKS_STORAGE_KEY = 'homepage-bookmarks-v1'

export const defaultBookmarkGroups: BookmarkGroup[] = [
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
]

export const iconMap: Record<string, LucideIcon> = {
  Calendar,
  Code,
  GitBranch,
  Globe,
  Mail,
  Music,
  Newspaper,
}

export function guessIcon(url: string): string {
  const value = url.toLowerCase()
  if (value.includes('github')) return 'GitBranch'
  if (value.includes('gmail') || value.includes('mail')) return 'Mail'
  if (value.includes('calendar')) return 'Calendar'
  if (value.includes('youtube') || value.includes('spotify') || value.includes('soundcloud') || value.includes('music')) return 'Music'
  if (value.includes('news') || value.includes('hacker')) return 'Newspaper'
  if (value.includes('mdn') || value.includes('developer') || value.includes('docs') || value.includes('stackoverflow')) return 'Code'
  if (value.includes('maps') || value.includes('earth')) return 'Globe'
  return 'Link'
}

export function useBookmarkStore() {
  return useLocalStorage<BookmarkGroup[]>(BOOKMARKS_STORAGE_KEY, defaultBookmarkGroups, { debounceMs: 200 })
}
