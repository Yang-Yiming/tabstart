import { useMemo, useState, type DragEvent } from 'react'
import { Check, ChevronLeft, ChevronRight, ListTodo, Plus, Target } from 'lucide-react'
import { WidgetCard } from '../../components/WidgetCard'
import { formatDateKey } from '../_shared/activity'
import { useKanbanStore } from '../kanban/kanban'
import { getDragData, isTaskDrag, transferKanbanToTodo } from '../_shared/taskTransfer'
import { useWidgetSettings } from '../widgetSettings'
import {
  addDays,
  createId,
  formatDateLabel,
  isCompleted,
  isOverdue,
  isScheduledForDate,
  removeTodoItem,
  toggleTodoItem,
  useTodoStore,
  type TodoHorizon,
  type TodoItem,
  type TodoRecurrence,
} from './todo'
import { GoalRow, TaskRow } from './TodoWidget'

const COLUMNS: Array<{ horizon: TodoHorizon; label: string; empty: string; placeholder: string }> = [
  { horizon: 'daily', label: 'Today', empty: 'Nothing planned', placeholder: 'New task...' },
  { horizon: 'weekly', label: 'Week', empty: 'No weekly tasks', placeholder: 'New weekly task...' },
  { horizon: 'goal', label: 'Goals', empty: 'No goals yet', placeholder: 'New goal...' },
]

/**
 * Expanded variant of the todo widget: all three horizons side by side
 * (Today / Week / Goals) instead of the grid version's single active view.
 * Shares the todo store with the grid instance, and accepts kanban task
 * drops per column.
 */
export function TodoExpandedWidget() {
  const [store, setStore] = useTodoStore()
  const [kanbanStore, setKanbanStore] = useKanbanStore()
  const { settings } = useWidgetSettings('todo')
  const carryOverOverdue = Boolean(settings.carryOverOverdue)
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [adding, setAdding] = useState<TodoHorizon | null>(null)
  const [draft, setDraft] = useState('')
  const [recurrence, setRecurrence] = useState<TodoRecurrence>('none')
  const [dragOver, setDragOver] = useState<TodoHorizon | null>(null)

  const goals = useMemo(() => store.items.filter((item) => item.horizon === 'goal'), [store.items])

  const columns = useMemo(() => {
    const todayKey = formatDateKey(new Date())
    const selectedKey = formatDateKey(selectedDate)
    const byHorizon = (horizon: TodoHorizon) => store.items.filter((item) => item.horizon === horizon)
    return {
      daily: byHorizon('daily')
        .filter(
          (item) =>
            isScheduledForDate(item, selectedDate) ||
            (selectedKey === todayKey && carryOverOverdue && isOverdue(item)),
        )
        .sort((a, b) => Number(isOverdue(b)) - Number(isOverdue(a))),
      weekly: byHorizon('weekly'),
      goal: byHorizon('goal'),
    }
  }, [carryOverOverdue, selectedDate, store.items])

  const toggleItem = (item: TodoItem) => {
    setStore((prev) => ({ ...prev, items: toggleTodoItem(prev.items, item, selectedDate) }))
  }

  const removeItem = (id: string) => {
    setStore((prev) => ({ ...prev, items: removeTodoItem(prev.items, id) }))
  }

  const addItem = (horizon: TodoHorizon) => {
    const title = draft.trim()
    if (!title) return
    const item: TodoItem = {
      id: createId(),
      title,
      horizon,
      recurrence: horizon === 'goal' ? 'none' : recurrence,
      scheduledDate: horizon === 'daily' ? formatDateKey(selectedDate) : undefined,
      createdAt: new Date().toISOString(),
      completedDates: horizon === 'goal' || recurrence === 'none' ? undefined : [],
    }
    setStore((prev) => ({ ...prev, items: [...prev.items, item] }))
    setDraft('')
    setRecurrence('none')
    setAdding(null)
  }

  const handleTaskDrop = (event: DragEvent, horizon: TodoHorizon) => {
    event.preventDefault()
    setDragOver(null)
    const dragged = getDragData(event)
    if (!dragged || dragged.source !== 'kanban') return
    const { kanban, todo } = transferKanbanToTodo(
      kanbanStore,
      store,
      dragged.id,
      horizon,
      horizon === 'daily' ? formatDateKey(selectedDate) : undefined,
    )
    setKanbanStore(kanban)
    setStore(todo)
  }

  return (
    <WidgetCard className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white/45">
          <ListTodo className="h-3 w-3 text-emerald-200/80" />
          Tasks
        </div>
        <span className="font-mono text-[10px] text-white/35">{store.items.length} items</span>
      </div>

      <div className="flex min-h-0 flex-1 gap-2">
        {COLUMNS.map(({ horizon, label, empty, placeholder }) => {
          const items = columns[horizon]
          const isDropColumn = dragOver === horizon
          const completedCount = items.filter((item) => isCompleted(item, selectedDate)).length
          return (
            <div
              key={horizon}
              onDragOver={(event) => {
                if (!isTaskDrag(event)) return
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
                setDragOver(horizon)
              }}
              onDragLeave={() => setDragOver((prev) => (prev === horizon ? null : prev))}
              onDrop={(event) => handleTaskDrop(event, horizon)}
              className={[
                'flex min-h-0 min-w-0 flex-1 flex-col gap-1.5 rounded-2xl border border-white/10 bg-black/15 p-2 transition',
                isDropColumn ? 'border-white/30 bg-black/25' : '',
              ].join(' ')}
            >
              <div className="flex items-center gap-1.5 px-1">
                {horizon === 'goal' ? (
                  <Target className="h-3 w-3 shrink-0 text-amber-200/70" />
                ) : (
                  <span className={['h-1.5 w-1.5 shrink-0 rounded-full', horizon === 'daily' ? 'bg-sky-300/80' : 'bg-violet-300/80'].join(' ')} />
                )}
                <span className="text-[11px] font-medium text-white/70">{label}</span>
                <span className="font-mono text-[9px] text-white/35">
                  {horizon === 'goal' ? `${items.length}` : `${completedCount}/${items.length}`}
                </span>
                {horizon === 'daily' && (
                  <div className="ml-auto flex items-center rounded-full bg-white/[0.06] p-0.5">
                    <button
                      type="button"
                      onClick={() => setSelectedDate((date) => addDays(date, -1))}
                      className="rounded-full p-0.5 text-white/40 transition hover:bg-white/10 hover:text-white"
                      aria-label="Previous day"
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDate(new Date())}
                      className="max-w-20 truncate px-1 text-[10px] font-medium text-white/65 transition hover:text-white"
                      title="Return to today"
                    >
                      {formatDateLabel(selectedDate)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDate((date) => addDays(date, 1))}
                      className="rounded-full p-0.5 text-white/40 transition hover:bg-white/10 hover:text-white"
                      aria-label="Next day"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {items.length === 0 ? (
                  <div className="grid h-full min-h-10 place-items-center text-[10px] text-white/25">{empty}</div>
                ) : horizon === 'goal' ? (
                  <div className="space-y-1">
                    {items.map((goal) => (
                      <GoalRow key={goal.id} goal={goal} items={store.items} onToggle={toggleItem} onRemove={removeItem} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {items.map((item) => (
                      <TaskRow key={item.id} item={item} goals={goals} date={selectedDate} onToggle={toggleItem} onRemove={removeItem} />
                    ))}
                  </div>
                )}
              </div>

              {adding === horizon ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    addItem(horizon)
                  }}
                  className="rounded-xl border border-white/10 bg-black/10 p-2"
                >
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') setAdding(null)
                      }}
                      placeholder={placeholder}
                      className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                    />
                    <button
                      type="submit"
                      disabled={!draft.trim()}
                      className="rounded-lg bg-white/15 p-1 text-white/75 transition hover:bg-white/25 disabled:opacity-30"
                      aria-label={`Add to ${label}`}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                  {horizon !== 'goal' && (
                    <select
                      value={recurrence}
                      onChange={(event) => setRecurrence(event.target.value as TodoRecurrence)}
                      className="mt-2 min-w-0 rounded-md bg-white/10 px-1.5 py-1 text-[10px] text-white/60 outline-none"
                      aria-label="Repeat schedule"
                    >
                      <option value="none">Once</option>
                      <option value="daily">Daily</option>
                      <option value="weekdays">Weekdays</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  )}
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setDraft('')
                    setRecurrence('none')
                    setAdding(horizon)
                  }}
                  className="flex items-center justify-center gap-1 rounded-lg py-1 text-[10px] font-medium text-white/30 transition hover:bg-white/5 hover:text-white/70"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              )}
            </div>
          )
        })}
      </div>
    </WidgetCard>
  )
}
