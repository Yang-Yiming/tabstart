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
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useStoredState } from '../../hooks/useLocalStorage'

export interface BookmarkLink {
  id: string
  title: string
  url: string
  icon: string
}

export interface BookmarkGroup {
  id: string
  title: string
  links: BookmarkLink[]
}

export const BOOKMARKS_STORAGE_KEY = 'homepage-bookmarks-v1'

let idCounter = 0

/** Stable id for a group/link row. Random enough to survive reorders. */
export function newBookmarkId(prefix: 'group' | 'link'): string {
  idCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}`
}

export const defaultBookmarkGroups: BookmarkGroup[] = [
  {
    id: 'group-work',
    title: 'Work',
    links: [
      { id: 'link-gmail', title: 'Gmail', url: 'https://mail.google.com', icon: 'Mail' },
      { id: 'link-calendar', title: 'Calendar', url: 'https://calendar.google.com', icon: 'Calendar' },
      { id: 'link-github', title: 'GitHub', url: 'https://github.com', icon: 'GitBranch' },
    ],
  },
  {
    id: 'group-read',
    title: 'Read',
    links: [
      { id: 'link-hn', title: 'Hacker News', url: 'https://news.ycombinator.com', icon: 'Newspaper' },
      { id: 'link-mdn', title: 'MDN', url: 'https://developer.mozilla.org', icon: 'Code' },
    ],
  },
]

/**
 * Fill in missing ids for data stored before ids existed. Cached by array
 * identity so the render read and the persist effect resolve the same ids —
 * otherwise each pass would mint new ones and remount every row.
 */
const migratedCache = new WeakMap<BookmarkGroup[], BookmarkGroup[]>()

function withBookmarkIds(groups: BookmarkGroup[]): BookmarkGroup[] {
  const needsId = groups.some(
    (group) => !group.id || group.links.some((link) => !link.id),
  )
  if (!needsId) return groups
  const cached = migratedCache.get(groups)
  if (cached) return cached
  const migrated = groups.map((group) => ({
    id: group.id ?? newBookmarkId('group'),
    title: group.title,
    links: group.links.map((link) => ({
      id: link.id ?? newBookmarkId('link'),
      title: link.title,
      url: link.url,
      icon: link.icon,
    })),
  }))
  migratedCache.set(groups, migrated)
  return migrated
}

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
  const [stored, setStored, hydrated] = useStoredState<BookmarkGroup[]>(
    BOOKMARKS_STORAGE_KEY,
    defaultBookmarkGroups,
    { debounceMs: 200 },
  )
  const groups = useMemo(() => withBookmarkIds(stored), [stored])

  // Persist the id migration once, so legacy rows stop regenerating ids across
  // reloads. No-op for data that already has ids.
  const migratedRef = useRef(false)
  useEffect(() => {
    if (!hydrated || migratedRef.current) return
    migratedRef.current = true
    const migrated = withBookmarkIds(stored)
    if (migrated !== stored) setStored(migrated)
  }, [hydrated, stored, setStored])

  const setGroups = useCallback(
    (value: BookmarkGroup[] | ((prev: BookmarkGroup[]) => BookmarkGroup[])) => {
      setStored((prev) => {
        const base = withBookmarkIds(prev)
        const next = typeof value === 'function' ? value(base) : value
        return withBookmarkIds(next)
      })
    },
    [setStored],
  )

  return [groups, setGroups] as const
}
