import { useState } from 'react'
import { Check, Link as LinkIcon, Pencil, Plus, Trash2, X } from 'lucide-react'
import { WidgetCard } from '../components/WidgetCard'
import {
  guessIcon,
  iconMap,
  useBookmarkStore,
  type BookmarkGroup,
  type BookmarkLink,
} from './bookmarks'

export function BookmarksWidget() {
  const [groups, setGroups] = useBookmarkStore()
  const [newGroupIndex, setNewGroupIndex] = useState<number | null>(null)

  const updateGroup = (index: number, updater: (group: BookmarkGroup) => BookmarkGroup) => {
    setGroups((prev) => prev.map((group, i) => (i === index ? updater(group) : group)))
  }

  const removeGroup = (index: number) => {
    setGroups((prev) => prev.filter((_, i) => i !== index))
  }

  const addGroup = () => {
    setGroups((prev) => [...prev, { title: 'New Group', links: [] }])
    setNewGroupIndex(groups.length)
  }

  return (
    <WidgetCard className="flex h-full flex-col gap-4">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-white/60">
        Bookmarks
      </h2>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {groups.length === 0 ? (
          <button
            type="button"
            onClick={addGroup}
            className="flex h-full min-h-20 w-full flex-col items-center justify-center gap-1 text-white/35 transition hover:text-white/60"
          >
            <LinkIcon className="h-5 w-5" />
            <span className="text-xs">Add a bookmark group</span>
          </button>
        ) : (
          <div className="flex flex-col gap-5">
            {groups.map((group, index) => (
              <Group
                key={index}
                group={group}
                index={index}
                onUpdate={updateGroup}
                onRemove={removeGroup}
                autoFocus={index === newGroupIndex}
                onInitialEditDone={() => setNewGroupIndex(null)}
              />
            ))}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={addGroup}
        className="flex items-center gap-1.5 self-start text-[11px] font-medium text-white/35 transition hover:text-white/75"
      >
        <Plus className="h-3.5 w-3.5" />
        Add group
      </button>
    </WidgetCard>
  )
}

interface GroupProps {
  group: BookmarkGroup
  index: number
  onUpdate: (index: number, updater: (group: BookmarkGroup) => BookmarkGroup) => void
  onRemove: (index: number) => void
  autoFocus?: boolean
  onInitialEditDone?: () => void
}

function Group({ group, index, onUpdate, onRemove, autoFocus = false, onInitialEditDone }: GroupProps) {
  const [editingTitle, setEditingTitle] = useState(autoFocus)
  const [titleDraft, setTitleDraft] = useState(group.title)
  const [adding, setAdding] = useState(false)

  const doneTitleEdit = () => {
    setEditingTitle(false)
    if (autoFocus) onInitialEditDone?.()
  }

  const saveTitle = () => {
    const title = titleDraft.trim()
    if (!title) return
    onUpdate(index, (candidate) => ({ ...candidate, title }))
    doneTitleEdit()
  }

  const addLink = (link: BookmarkLink) => {
    onUpdate(index, (candidate) => ({ ...candidate, links: [...candidate.links, link] }))
    setAdding(false)
  }

  const updateLink = (linkIndex: number, updater: (link: BookmarkLink) => BookmarkLink) => {
    onUpdate(index, (candidate) => ({
      ...candidate,
      links: candidate.links.map((link, i) => (i === linkIndex ? updater(link) : link)),
    }))
  }

  const removeLink = (linkIndex: number) => {
    onUpdate(index, (candidate) => ({
      ...candidate,
      links: candidate.links.filter((_, i) => i !== linkIndex),
    }))
  }

  return (
    <div className="group/header">
      <div className="mb-2 flex min-h-5 items-center gap-1">
        {editingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(event) => setTitleDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') saveTitle()
              if (event.key === 'Escape') doneTitleEdit()
            }}
            className="min-w-0 flex-1 rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium text-white outline-none"
          />
        ) : (
          <h3 className="min-w-0 truncate text-xs font-medium text-white/80">{group.title}</h3>
        )}
        <button
          type="button"
          onClick={() => {
            setTitleDraft(group.title)
            setEditingTitle(true)
          }}
          className="shrink-0 p-0.5 text-white/0 transition group-hover/header:text-white/30 hover:!text-white/70"
          aria-label="Rename group"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="shrink-0 p-0.5 text-white/0 transition group-hover/header:text-white/30 hover:!text-red-200"
          aria-label="Delete group"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
        {group.links.map((link, linkIndex) => (
          <LinkRow
            key={linkIndex}
            link={link}
            onUpdate={(updater) => updateLink(linkIndex, updater)}
            onRemove={() => removeLink(linkIndex)}
          />
        ))}
      </ul>
      {adding ? (
        <LinkForm onSave={addLink} onCancel={() => setAdding(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-1 flex items-center gap-1 text-[11px] font-medium text-white/35 transition hover:text-white/75"
        >
          <Plus className="h-3 w-3" />
          Add link
        </button>
      )}
    </div>
  )
}

interface LinkRowProps {
  link: BookmarkLink
  onUpdate: (updater: (link: BookmarkLink) => BookmarkLink) => void
  onRemove: () => void
}

function LinkRow({ link, onUpdate, onRemove }: LinkRowProps) {
  const [editing, setEditing] = useState(false)
  const Icon = iconMap[link.icon] ?? LinkIcon

  if (editing) {
    return (
      <li>
        <LinkForm
          initial={link}
          onSave={(next) => {
            onUpdate(() => next)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    )
  }

  return (
    <li className="group/link flex items-center rounded-xl px-2 py-1.5 transition hover:bg-white/10">
      <a
        href={link.url}
        target="_blank"
        rel="noreferrer"
        className="flex min-w-0 flex-1 items-center gap-2 text-white/90"
      >
        <Icon className="h-4 w-4 shrink-0 text-white/60" />
        <span className="truncate text-sm">{link.title}</span>
      </a>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="ml-1 shrink-0 p-0.5 text-white/0 transition group-hover/link:text-white/30 hover:!text-white/70"
        aria-label="Edit link"
      >
        <Pencil className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 p-0.5 text-white/0 transition group-hover/link:text-white/30 hover:!text-red-200"
        aria-label="Delete link"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    </li>
  )
}

interface LinkFormProps {
  onSave: (link: BookmarkLink) => void
  onCancel: () => void
  initial?: BookmarkLink
}

function LinkForm({ onSave, onCancel, initial }: LinkFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [url, setUrl] = useState(initial?.url ?? '')
  const canSave = Boolean(title.trim() && url.trim())

  const submit = () => {
    if (!canSave) return
    onSave({
      title: title.trim(),
      url: url.trim(),
      icon: initial?.icon ?? guessIcon(url),
    })
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      className="mt-1 rounded-xl border border-white/10 bg-black/10 p-2"
    >
      <div className="flex items-center gap-1.5">
        <input
          autoFocus
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') onCancel()
          }}
          placeholder="Title"
          className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
        />
        <button
          type="submit"
          disabled={!canSave}
          className="rounded-lg bg-white/15 p-1 text-white/75 transition hover:bg-white/25 disabled:opacity-30"
          aria-label="Save link"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg p-1 text-white/45 transition hover:bg-white/10 hover:text-white"
          aria-label="Cancel"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <input
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onCancel()
        }}
        placeholder="https://..."
        className="mt-1 w-full bg-transparent text-[11px] text-white/60 outline-none placeholder:text-white/30"
      />
    </form>
  )
}
