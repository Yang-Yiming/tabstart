import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Circle, Plus, Repeat, SquareKanban, Trash2 } from 'lucide-react'
import { WidgetCard } from '../components/WidgetCard'
import {
  KANBAN_COLUMNS,
  moveTask,
  moveTaskToNextColumn,
  moveTaskToPrevColumn,
  nextColumn,
  prevColumn,
  toggleTaskComplete,
  useKanbanStore,
  type KanbanColumnId,
  type KanbanTask,
} from './kanban'

const COLUMN_META: Record<KanbanColumnId, { label: string; dot: string }> = {
  todo: { label: 'Todo', dot: 'bg-sky-300/80' },
  doing: { label: 'Doing', dot: 'bg-amber-300/80' },
  done: { label: 'Done', dot: 'bg-emerald-300/80' },
}

function createId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function KanbanFullWidget() {
  const [store, setStore] = useKanbanStore()
  const [addingColumn, setAddingColumn] = useState<KanbanColumnId | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<{ column: KanbanColumnId; taskId?: string } | null>(null)

  const tasksByColumn = useMemo(() => {
    const map: Record<KanbanColumnId, KanbanTask[]> = { todo: [], doing: [], done: [] }
    for (const task of store.tasks) map[task.column].push(task)
    return map
  }, [store.tasks])

  const handleDrop = (column: KanbanColumnId, beforeTaskId?: string) => {
    if (!draggingId) return
    setStore((prev) => ({ ...prev, tasks: moveTask(prev.tasks, draggingId, column, beforeTaskId) }))
    setDraggingId(null)
    setDragOver(null)
  }

  const handleRename = (taskId: string, title: string) => {
    setStore((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) => (task.id === taskId ? { ...task, title } : task)),
    }))
  }

  const handleRemove = (taskId: string) => {
    setStore((prev) => ({ ...prev, tasks: prev.tasks.filter((task) => task.id !== taskId) }))
  }

  const handleAdd = (column: KanbanColumnId, title: string) => {
    const task: KanbanTask = {
      id: createId(),
      title,
      column,
      createdAt: new Date().toISOString(),
    }
    setStore((prev) => ({ ...prev, tasks: [...prev.tasks, task] }))
    setAddingColumn(null)
  }

  return (
    <WidgetCard className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white/45">
          <SquareKanban className="h-3 w-3 text-sky-200/80" />
          Kanban
        </div>
        <span className="font-mono text-[10px] text-white/35">{store.tasks.length} tasks</span>
      </div>

      <div className="flex min-h-0 flex-1 gap-2">
        {KANBAN_COLUMNS.map((column) => {
          const tasks = tasksByColumn[column]
          const isDropColumn = dragOver?.column === column
          return (
            <div
              key={column}
              className={[
                'flex min-h-0 flex-1 flex-col gap-1.5 rounded-2xl border border-white/10 bg-black/15 p-2 transition',
                isDropColumn && !dragOver?.taskId ? 'border-white/30 bg-black/25' : '',
              ].join(' ')}
              onDragOver={(event) => {
                if (!draggingId) return
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
                setDragOver({ column })
              }}
              onDrop={(event) => {
                event.preventDefault()
                handleDrop(column)
              }}
            >
              <div className="flex items-center gap-1.5 px-1">
                <span className={['h-1.5 w-1.5 rounded-full', COLUMN_META[column].dot].join(' ')} />
                <span className="text-[11px] font-medium text-white/70">{COLUMN_META[column].label}</span>
                <span className="font-mono text-[9px] text-white/35">{tasks.length}</span>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {tasks.length === 0 ? (
                  <div className="grid h-full min-h-10 place-items-center text-[10px] text-white/25">
                    Drop here
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData('text/plain', task.id)
                          event.dataTransfer.effectAllowed = 'move'
                          setDraggingId(task.id)
                          setDragOver(null)
                        }}
                        onDragOver={(event) => {
                          if (!draggingId) return
                          event.preventDefault()
                          event.stopPropagation()
                          event.dataTransfer.dropEffect = 'move'
                          setDragOver({ column, taskId: task.id })
                        }}
                        onDrop={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          handleDrop(column, task.id)
                        }}
                        onDragEnd={() => {
                          setDraggingId(null)
                          setDragOver(null)
                        }}
                        className={[
                          'group/task flex items-start gap-1.5 rounded-xl border border-white/10 bg-white/[0.06] p-2 transition cursor-grab active:cursor-grabbing',
                          dragOver?.taskId === task.id ? 'border-white/40 bg-white/15' : '',
                          draggingId === task.id ? 'opacity-40' : '',
                        ].join(' ')}
                      >
                        <TaskToggle task={task} onToggle={(id) => setStore((prev) => ({ ...prev, tasks: toggleTaskComplete(prev.tasks, id) }))} />
                        <div className="min-w-0 flex-1 pt-0.5">
                          <EditableTitle
                            task={task}
                            done={task.column === 'done'}
                            onRename={handleRename}
                            className="block w-full truncate text-[12px] leading-snug"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemove(task.id)}
                          className="shrink-0 p-1 text-white/0 transition group-hover/task:text-white/30 hover:!text-red-200"
                          aria-label="Delete task"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {addingColumn === column ? (
                <AddTaskInput
                  placeholder={`Add to ${COLUMN_META[column].label}...`}
                  onAdd={(title) => handleAdd(column, title)}
                  onCancel={() => setAddingColumn(null)}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingColumn(column)}
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

export function KanbanCompactWidget() {
  const [store, setStore] = useKanbanStore()
  const [column, setColumn] = useState<KanbanColumnId>('todo')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const [active, setActive] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<{ tab?: KanbanColumnId; taskId?: string; list?: boolean } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const tasks = useMemo(
    () => store.tasks.filter((task) => task.column === column),
    [column, store.tasks],
  )
  const selectedIndex = tasks.findIndex((task) => task.id === selectedId)

  useEffect(() => {
    if (selectedId && !tasks.some((task) => task.id === selectedId)) setSelectedId(null)
  }, [selectedId, tasks])

  useEffect(() => {
    if (!active) return
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return
      switch (event.key) {
        case ']': {
          if (!selectedId) return
          const task = store.tasks.find((candidate) => candidate.id === selectedId)
          if (!task) return
          event.preventDefault()
          setStore((prev) => ({ ...prev, tasks: moveTaskToNextColumn(prev.tasks, selectedId) }))
          setColumn(nextColumn(task.column))
          break
        }
        case '[': {
          if (!selectedId) return
          const task = store.tasks.find((candidate) => candidate.id === selectedId)
          if (!task) return
          event.preventDefault()
          setStore((prev) => ({ ...prev, tasks: moveTaskToPrevColumn(prev.tasks, selectedId) }))
          setColumn(prevColumn(task.column))
          break
        }
        case 'Enter': {
          if (!selectedId) return
          event.preventDefault()
          setStore((prev) => ({ ...prev, tasks: toggleTaskComplete(prev.tasks, selectedId) }))
          break
        }
        case 'ArrowDown':
        case 'j': {
          if (tasks.length === 0) return
          event.preventDefault()
          const next = selectedIndex === -1 ? 0 : (selectedIndex + 1) % tasks.length
          setSelectedId(tasks[next].id)
          break
        }
        case 'ArrowUp':
        case 'k': {
          if (tasks.length === 0) return
          event.preventDefault()
          const next = selectedIndex === -1 ? tasks.length - 1 : (selectedIndex - 1 + tasks.length) % tasks.length
          setSelectedId(tasks[next].id)
          break
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [active, selectedId, selectedIndex, setStore, store.tasks, tasks])

  const addItem = () => {
    const title = draft.trim()
    if (!title) return
    const task: KanbanTask = {
      id: createId(),
      title,
      column,
      createdAt: new Date().toISOString(),
    }
    setStore((prev) => ({ ...prev, tasks: [...prev.tasks, task] }))
    setDraft('')
    setAdding(false)
  }

  const handleMove = (taskId: string) => {
    setStore((prev) => ({ ...prev, tasks: moveTaskToNextColumn(prev.tasks, taskId) }))
    setSelectedId(null)
  }

  const handleMovePrev = (taskId: string) => {
    setStore((prev) => ({ ...prev, tasks: moveTaskToPrevColumn(prev.tasks, taskId) }))
    setSelectedId(null)
  }

  const handleRename = (taskId: string, title: string) => {
    setStore((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task) => (task.id === taskId ? { ...task, title } : task)),
    }))
  }

  const handleRemove = (taskId: string) => {
    setStore((prev) => ({ ...prev, tasks: prev.tasks.filter((task) => task.id !== taskId) }))
    if (selectedId === taskId) setSelectedId(null)
  }

  const handleDrop = (targetColumn: KanbanColumnId, beforeTaskId?: string) => {
    if (!draggingId) return
    setStore((prev) => ({ ...prev, tasks: moveTask(prev.tasks, draggingId, targetColumn, beforeTaskId) }))
    if (targetColumn !== column) setColumn(targetColumn)
    setDraggingId(null)
    setDragOver(null)
  }

  return (
    <WidgetCard className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex shrink-0 rounded-full bg-white/[0.08] p-0.5">
          {KANBAN_COLUMNS.map((option) => {
            const isTarget = dragOver?.tab === option
            return (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setColumn(option)
                  setSelectedId(null)
                  setAdding(false)
                }}
                onDragOver={(event) => {
                  if (!draggingId) return
                  event.preventDefault()
                  event.dataTransfer.dropEffect = 'move'
                  setDragOver({ tab: option })
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  handleDrop(option)
                }}
                className={[
                  'rounded-full px-3 py-1 text-[11px] font-medium transition',
                  isTarget
                    ? 'bg-white/25 text-white ring-1 ring-white/40'
                    : column === option
                      ? 'bg-white/20 text-white shadow-sm'
                      : 'text-white/45 hover:text-white/80',
                ].join(' ')}
                title={isTarget ? `Move to ${COLUMN_META[option].label}` : undefined}
              >
                {COLUMN_META[option].label}
              </button>
            )
          })}
        </div>
        <span className="font-mono text-[10px] text-white/35">{tasks.length}</span>
      </div>

      <div
        ref={containerRef}
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => setActive(false)}
        onFocusCapture={() => setActive(true)}
        onBlurCapture={(event) => {
          if (containerRef.current && !containerRef.current.contains(event.relatedTarget as Node)) {
            setActive(false)
          }
        }}
        onDragOver={(event) => {
          if (!draggingId) return
          event.preventDefault()
          event.dataTransfer.dropEffect = 'move'
          setDragOver({ list: true })
        }}
        onDrop={(event) => {
          event.preventDefault()
          handleDrop(column)
        }}
        className={[
          'min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          dragOver?.list ? 'rounded-xl ring-1 ring-white/30' : '',
        ].join(' ')}
      >
        {tasks.length === 0 ? (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex h-full min-h-20 w-full flex-col items-center justify-center gap-1 text-white/35 transition hover:text-white/60"
          >
            <SquareKanban className="h-5 w-5" />
            <span className="text-xs">Nothing in {COLUMN_META[column].label}</span>
          </button>
        ) : (
          <div className="space-y-0.5">
            {tasks.map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('text/plain', task.id)
                  event.dataTransfer.effectAllowed = 'move'
                  setDraggingId(task.id)
                  setDragOver(null)
                }}
                onDragOver={(event) => {
                  if (!draggingId) return
                  event.preventDefault()
                  event.stopPropagation()
                  event.dataTransfer.dropEffect = 'move'
                  setDragOver({ taskId: task.id })
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  handleDrop(column, task.id)
                }}
                onDragEnd={() => {
                  setDraggingId(null)
                  setDragOver(null)
                }}
                onClick={() => setSelectedId(task.id)}
                className={[
                  'group/task flex min-h-8 cursor-pointer items-center gap-1.5 rounded-lg px-1.5 transition hover:bg-white/[0.06]',
                  task.id === selectedId ? 'bg-white/10 ring-1 ring-white/20' : '',
                  dragOver?.taskId === task.id ? 'bg-white/15 ring-1 ring-white/40' : '',
                  draggingId === task.id ? 'opacity-40' : '',
                ].join(' ')}
              >
                <TaskToggle task={task} onToggle={(id) => setStore((prev) => ({ ...prev, tasks: toggleTaskComplete(prev.tasks, id) }))} />
                <div className="min-w-0 flex-1">
                  <EditableTitle
                    task={task}
                    done={task.column === 'done'}
                    onRename={handleRename}
                    className="block w-full truncate text-[13px] leading-tight"
                  />
                </div>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    handleMovePrev(task.id)
                  }}
                  className="shrink-0 rounded p-1 text-white/35 transition hover:bg-white/10 hover:text-white"
                  title={`Move to ${COLUMN_META[prevColumn(task.column)].label}`}
                  aria-label="Move to previous column"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    handleMove(task.id)
                  }}
                  className="shrink-0 rounded p-1 text-white/35 transition hover:bg-white/10 hover:text-white"
                  title={task.column === 'done' ? 'Move back to Todo' : `Move to ${COLUMN_META[nextColumn(task.column)].label}`}
                  aria-label="Move to next column"
                >
                  {task.column === 'done' ? <Repeat className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    handleRemove(task.id)
                  }}
                  className="shrink-0 p-1 text-white/0 transition group-hover/task:text-white/30 hover:!text-red-200"
                  aria-label="Delete task"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {adding ? (
        <AddTaskInput placeholder={`Add to ${COLUMN_META[column].label}...`} onAdd={addItem} onCancel={() => setAdding(false)} />
      ) : (
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 text-[11px] font-medium text-white/35 transition hover:text-white/75"
          >
            <Plus className="h-3.5 w-3.5" />
            Add task
          </button>
          <span className="font-mono text-[9px] text-white/25">
            drag · j/k select · [ ] move · enter done
          </span>
        </div>
      )}
    </WidgetCard>
  )
}

interface TaskToggleProps {
  task: KanbanTask
  onToggle: (taskId: string) => void
}

function TaskToggle({ task, onToggle }: TaskToggleProps) {
  const done = task.column === 'done'
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onToggle(task.id)
      }}
      className="mt-0.5 shrink-0 text-white/45 transition hover:text-emerald-200"
      aria-label={done ? 'Mark incomplete' : 'Complete task'}
      title={done ? `Move back to ${task.completedFrom ?? 'todo'}` : 'Move to Done'}
    >
      {done ? (
        <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-300/80 text-emerald-950">
          <Check className="h-3 w-3" />
        </span>
      ) : (
        <Circle className="h-4 w-4" />
      )}
    </button>
  )
}

interface EditableTitleProps {
  task: KanbanTask
  done: boolean
  onRename: (taskId: string, title: string) => void
  className?: string
}

function EditableTitle({ task, done, onRename, className = '' }: EditableTitleProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(task.title)

  const commit = () => {
    const title = draft.trim()
    if (title && title !== task.title) onRename(task.id, title)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit()
          if (event.key === 'Escape') setEditing(false)
        }}
        onClick={(event) => event.stopPropagation()}
        className={[
          'w-full rounded bg-transparent outline-none placeholder:text-white/30',
          done ? 'text-white/50 line-through' : 'text-white/85',
          className,
        ].join(' ')}
      />
    )
  }

  return (
    <span
      title="Double-click to edit"
      onDoubleClick={(event) => {
        event.stopPropagation()
        setDraft(task.title)
        setEditing(true)
      }}
      className={[
        'cursor-text',
        done ? 'text-white/30 line-through' : 'text-white/85',
        className,
      ].join(' ')}
    >
      {task.title}
    </span>
  )
}

interface AddTaskInputProps {
  placeholder: string
  onAdd: (title: string) => void
  onCancel: () => void
}

function AddTaskInput({ placeholder, onAdd, onCancel }: AddTaskInputProps) {
  const [draft, setDraft] = useState('')
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        if (!draft.trim()) return
        onAdd(draft.trim())
      }}
      className="shrink-0 rounded-xl border border-white/10 bg-black/10 p-2"
    >
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') onCancel()
          }}
          placeholder={placeholder}
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
    </form>
  )
}
