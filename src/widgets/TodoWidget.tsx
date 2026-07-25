import { useMemo, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Circle, Plus, Repeat2, Target, Trash2 } from 'lucide-react'
import { WidgetCard } from '../components/WidgetCard'
import { formatDateKey } from './activity'
import {
  addDays,
  isCompleted,
  isOverdue,
  isRecurring,
  isScheduledForDate,
  recurrenceCompletionKey,
  useTodoStore,
  type TodoHorizon,
  type TodoItem,
  type TodoRecurrence,
} from './todo'

type View = 'daily' | 'weekly' | 'goal'

const VIEW_LABELS: Array<{ id: View; label: string }> = [
  { id: 'daily', label: 'Today' },
  { id: 'weekly', label: 'Week' },
  { id: 'goal', label: 'Goals' },
]

function createId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function TodoWidget() {
  const [store, setStore] = useTodoStore()
  const [view, setView] = useState<View>('daily')
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const [recurrence, setRecurrence] = useState<TodoRecurrence>('none')
  const [parentId, setParentId] = useState('')
  const [selectedDate, setSelectedDate] = useState(() => new Date())

  const goals = useMemo(() => store.items.filter((item) => item.horizon === 'goal'), [store.items])
  const visibleItems = useMemo(() => {
    if (view === 'daily') {
      const todayKey = formatDateKey(new Date())
      const selectedKey = formatDateKey(selectedDate)
      return store.items
        .filter((item) => isScheduledForDate(item, selectedDate) || (selectedKey === todayKey && isOverdue(item)))
        .sort((a, b) => Number(isOverdue(b)) - Number(isOverdue(a)))
    }
    return store.items.filter((item) => item.horizon === view)
  }, [selectedDate, store.items, view])

  const addItem = () => {
    const title = draft.trim()
    if (!title) return
    const item: TodoItem = {
      id: createId(),
      title,
      horizon: view as TodoHorizon,
      recurrence: view === 'goal' ? 'none' : recurrence,
      parentId: view === 'goal' || !parentId ? undefined : parentId,
      scheduledDate: view === 'daily' ? formatDateKey(selectedDate) : undefined,
      createdAt: new Date().toISOString(),
      completedDates: recurrence === 'none' ? undefined : [],
    }
    setStore((prev) => ({ ...prev, items: [...prev.items, item] }))
    setDraft('')
    setRecurrence('none')
    setAdding(false)
  }

  const toggleItem = (item: TodoItem) => {
    const completionKey = recurrenceCompletionKey(item, selectedDate)
    setStore((prev) => ({
      ...prev,
      items: prev.items.map((candidate) => {
        if (candidate.id !== item.id) return candidate
        if (!isRecurring(candidate)) {
          return { ...candidate, completedAt: candidate.completedAt ? undefined : new Date().toISOString() }
        }
        const dates = new Set(candidate.completedDates ?? [])
        if (dates.has(completionKey)) dates.delete(completionKey)
        else dates.add(completionKey)
        return { ...candidate, completedDates: [...dates] }
      }),
    }))
  }

  const removeItem = (id: string) => {
    setStore((prev) => ({
      ...prev,
      items: prev.items
        .filter((item) => item.id !== id)
        .map((item) => item.parentId === id ? { ...item, parentId: undefined } : item),
    }))
  }

  const completedCount = visibleItems.filter((item) => isCompleted(item, selectedDate)).length
  const selectedDateLabel = formatDateLabel(selectedDate)

  return (
    <WidgetCard className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <div className="flex shrink-0 rounded-full bg-white/[0.08] p-0.5">
            {VIEW_LABELS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setView(option.id)
                  setAdding(false)
                }}
                className={[
                  'rounded-full px-3 py-1 text-[11px] font-medium transition',
                  view === option.id
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'text-white/45 hover:text-white/80',
                ].join(' ')}
              >
                {option.label}
              </button>
            ))}
          </div>
          {view === 'daily' && (
            <div className="flex min-w-0 items-center rounded-full bg-white/[0.06] p-0.5">
              <button
                type="button"
                onClick={() => setSelectedDate((date) => addDays(date, -1))}
                className="rounded-full p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
                aria-label="Previous day"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(new Date())}
                className="max-w-16 truncate px-1 text-[10px] font-medium text-white/65 transition hover:text-white"
                title="Return to today"
              >
                {selectedDateLabel}
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate((date) => addDays(date, 1))}
                className="rounded-full p-1 text-white/40 transition hover:bg-white/10 hover:text-white"
                aria-label="Next day"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
        <span className="font-mono text-[10px] text-white/35">
          {view === 'goal' ? `${visibleItems.length} active` : `${completedCount}/${visibleItems.length}`}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visibleItems.length === 0 ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex h-full min-h-20 w-full flex-col items-center justify-center gap-1 text-white/35 transition hover:text-white/60"
          >
            {view === 'goal' ? <Target className="h-5 w-5" /> : <Check className="h-5 w-5" />}
            <span className="text-xs">{view === 'goal' ? 'Add a long-term goal' : 'Nothing planned yet'}</span>
          </button>
        ) : view === 'goal' ? (
          <div className="space-y-1">
            {visibleItems.map((goal) => (
              <GoalRow key={goal.id} goal={goal} items={store.items} onToggle={toggleItem} onRemove={removeItem} />
            ))}
          </div>
        ) : (
          <div className="space-y-0.5">
            {visibleItems.map((item) => (
              <TaskRow key={item.id} item={item} goals={goals} date={selectedDate} onToggle={toggleItem} onRemove={removeItem} />
            ))}
          </div>
        )}
      </div>

      {adding ? (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            addItem()
          }}
          className="rounded-xl border border-white/10 bg-black/10 p-2"
        >
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setAdding(false)
              }}
              placeholder={view === 'goal' ? 'New goal...' : 'New task...'}
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="rounded-lg bg-white/15 p-1 text-white/75 transition hover:bg-white/25 disabled:opacity-30"
              aria-label="Add task"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {view !== 'goal' && (
            <div className="mt-2 flex items-center gap-2">
              <select
                value={recurrence}
                onChange={(event) => setRecurrence(event.target.value as TodoRecurrence)}
                className="min-w-0 rounded-md bg-white/10 px-1.5 py-1 text-[10px] text-white/60 outline-none"
                aria-label="Repeat schedule"
              >
                <option value="none">Once</option>
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays</option>
                <option value="weekly">Weekly</option>
              </select>
              {goals.length > 0 && (
                <select
                  value={parentId}
                  onChange={(event) => setParentId(event.target.value)}
                  className="min-w-0 flex-1 rounded-md bg-white/10 px-1.5 py-1 text-[10px] text-white/60 outline-none"
                  aria-label="Related goal"
                >
                  <option value="">No goal</option>
                  {goals.map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}
                </select>
              )}
            </div>
          )}
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 self-start text-[11px] font-medium text-white/35 transition hover:text-white/75"
        >
          <Plus className="h-3.5 w-3.5" />
          Add {view === 'goal' ? 'goal' : 'task'}
        </button>
      )}
    </WidgetCard>
  )
}

interface TaskRowProps {
  item: TodoItem
  goals: TodoItem[]
  date: Date
  onToggle: (item: TodoItem) => void
  onRemove: (id: string) => void
}

function TaskRow({ item, goals, date, onToggle, onRemove }: TaskRowProps) {
  const done = isCompleted(item, date)
  const goal = goals.find((candidate) => candidate.id === item.parentId)
  const overdue = isOverdue(item)
  return (
    <div className="group/task flex min-h-8 items-center gap-2 rounded-lg px-1.5 transition hover:bg-white/[0.06]">
      <button type="button" onClick={() => onToggle(item)} className="shrink-0 text-white/45 transition hover:text-emerald-200" aria-label={done ? 'Mark incomplete' : 'Complete task'}>
        {done ? <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-300/80 text-emerald-950"><Check className="h-3 w-3" /></span> : <Circle className="h-4 w-4" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className={['truncate text-[13px] leading-tight transition', done ? 'text-white/30 line-through' : 'text-white/85'].join(' ')}>{item.title}</div>
        {(goal || isRecurring(item) || overdue) && (
          <div className="mt-0.5 flex items-center gap-2 truncate text-[9px] text-white/30">
            {overdue && <span className="text-amber-200/70">Overdue</span>}
            {goal && <span className="truncate">{goal.title}</span>}
            {isRecurring(item) && <span className="flex items-center gap-0.5"><Repeat2 className="h-2.5 w-2.5" />{item.recurrence}</span>}
          </div>
        )}
      </div>
      <button type="button" onClick={() => onRemove(item.id)} className="shrink-0 p-1 text-white/0 transition group-hover/task:text-white/30 hover:!text-red-200" aria-label="Delete task"><Trash2 className="h-3 w-3" /></button>
    </div>
  )
}

function formatDateLabel(date: Date) {
  const key = formatDateKey(date)
  const today = formatDateKey(new Date())
  const tomorrow = formatDateKey(addDays(new Date(), 1))
  if (key === today) return 'Today'
  if (key === tomorrow) return 'Tomorrow'
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

interface GoalRowProps {
  goal: TodoItem
  items: TodoItem[]
  onToggle: (item: TodoItem) => void
  onRemove: (id: string) => void
}

function GoalRow({ goal, items, onToggle, onRemove }: GoalRowProps) {
  const children = items.filter((item) => item.parentId === goal.id)
  const completed = children.filter((item) => isCompleted(item)).length
  const progress = children.length > 0 ? Math.round((completed / children.length) * 100) : 0
  const next = children.find((item) => !isCompleted(item))
  const done = isCompleted(goal)
  return (
    <div className="group/task rounded-xl px-2 py-1.5 transition hover:bg-white/[0.06]">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onToggle(goal)} className="shrink-0 text-white/40 transition hover:text-emerald-200" aria-label={done ? 'Reopen goal' : 'Complete goal'}>
          {done ? <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-300/80 text-emerald-950"><Check className="h-3 w-3" /></span> : <Target className="h-4 w-4" />}
        </button>
        <span className={['min-w-0 flex-1 truncate text-[13px] font-medium', done ? 'text-white/30 line-through' : 'text-white/85'].join(' ')}>{goal.title}</span>
        <span className="font-mono text-[9px] text-white/35">{progress}%</span>
        <button type="button" onClick={() => onRemove(goal.id)} className="p-1 text-white/0 transition group-hover/task:text-white/30 hover:!text-red-200" aria-label="Delete goal"><Trash2 className="h-3 w-3" /></button>
      </div>
      <div className="ml-6 mt-1 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-amber-200/70 transition-all" style={{ width: `${progress}%` }} /></div>
      <div className="ml-6 mt-1 truncate text-[9px] text-white/30">{next ? `Next: ${next.title}` : children.length ? 'All linked tasks complete' : 'No linked tasks yet'}</div>
    </div>
  )
}
