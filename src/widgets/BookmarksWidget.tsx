import {
  Calendar,
  Code,
  GitBranch,
  Globe,
  Link as LinkIcon,
  Mail,
  Music,
  Newspaper,
  type LucideIcon,
} from 'lucide-react'
import { WidgetCard } from '../components/WidgetCard'
import { homepageConfig } from '../config/homepage'

const iconMap: Record<string, LucideIcon> = {
  Calendar,
  Code,
  GitBranch,
  Globe,
  Mail,
  Music,
  Newspaper,
}

export function BookmarksWidget() {
  return (
    <WidgetCard className="flex h-full flex-col gap-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
        Bookmarks
      </h2>
      <div className="flex flex-1 flex-col gap-6">
        {homepageConfig.bookmarks.map((group) => (
          <div key={group.title}>
            <h3 className="mb-2 text-xs font-medium text-accent dark:text-accent-dark">{group.title}</h3>
            <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {group.links.map((link) => {
                const Icon = iconMap[link.icon] ?? LinkIcon
                return (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-text-primary transition hover:bg-panel-highlight dark:text-text-primary-dark dark:hover:bg-panel-highlight-dark"
                    >
                      <Icon className="h-4 w-4 text-text-muted" />
                      <span className="text-sm">{link.title}</span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </WidgetCard>
  )
}
