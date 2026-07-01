import { useMemo, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { WidgetCard } from '../components/WidgetCard'
import { useLocalStorage } from '../hooks/useLocalStorage'

interface TopicData {
  [dateKey: string]: number
}

interface HeatmapStore {
  topics: string[]
  data: Record<string, TopicData>
  goals: Record<string, number>
}

const DEFAULT_TOPICS = ['论文', '代码']
const WEEKS = 53
const MAX_VALUE = 4

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatKey(date: Date) {
  return date.toISOString().split('T')[0]
}

export function HeatmapWidget() {
  const [store, setStore] = useLocalStorage<HeatmapStore>('homepage-heatmap', {
    topics: DEFAULT_TOPICS,
    data: {},
    goals: {},
  })
  const [activeTopic, setActiveTopic] = useState(store.topics[0] ?? DEFAULT_TOPICS[0])
  const [selected, setSelected] = useState<Date | null>(null)

  const todayKey = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return formatKey(d)
  }, [])

  const weeks = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayWeekday = today.getDay() === 0 ? 6 : today.getDay() - 1
    const result: Date[][] = []
    const end = addDays(today, -todayWeekday)
    for (let w = 0; w < WEEKS; w++) {
      const monday = addDays(end, -(WEEKS - 1 - w) * 7)
      const days: Date[] = []
      for (let d = 0; d < 7; d++) {
        days.push(addDays(monday, d))
      }
      result.push(days)
    }
    return result
  }, [])

  const monthLabels = useMemo(() => {
    const labels: { weekIdx: number; label: string }[] = []
    weeks.forEach((days, idx) => {
      const firstDay = days[0]
      const prevMonth = idx > 0 ? weeks[idx - 1][0].getMonth() : -1
      if (firstDay.getDate() <= 7 && firstDay.getMonth() !== prevMonth) {
        labels.push({
          weekIdx: idx,
          label: firstDay.toLocaleDateString('en-US', { month: 'short' }),
        })
      }
    })
    return labels
  }, [weeks])

  const getValue = (date: Date) => {
    return store.data[activeTopic]?.[formatKey(date)] ?? 0
  }

  const setValue = (date: Date, delta: number) => {
    const key = formatKey(date)
    setStore((prev) => {
      const topicData = { ...(prev.data[activeTopic] ?? {}) }
      const next = Math.max(0, Math.min(MAX_VALUE, (topicData[key] ?? 0) + delta))
      topicData[key] = next
      return { ...prev, data: { ...prev.data, [activeTopic]: topicData } }
    })
  }

  const addTopic = () => {
    const name = window.prompt('New topic name')
    if (!name || store.topics.includes(name)) return
    setStore((prev) => ({ ...prev, topics: [...prev.topics, name] }))
    setActiveTopic(name)
  }

  const removeTopic = (topic: string) => {
    if (!window.confirm(`Delete topic "${topic}"?`)) return
    setStore((prev) => {
      const topics = prev.topics.filter((t) => t !== topic)
      const data = { ...prev.data }
      const goals = { ...prev.goals }
      delete data[topic]
      delete goals[topic]
      return { topics, data, goals }
    })
    if (activeTopic === topic) {
      setActiveTopic(store.topics.find((t) => t !== topic) ?? '')
    }
  }

  const selectedValue = selected ? getValue(selected) : 0

  const total = useMemo(() => {
    const topicData = store.data[activeTopic] ?? {}
    return Object.values(topicData).reduce((sum, v) => sum + v, 0)
  }, [store.data, activeTopic])

  const goal = store.goals[activeTopic] ?? 0
  const goalMet = goal > 0 && total >= goal

  const setGoal = (value: number) => {
    setStore((prev) => ({
      ...prev,
      goals: { ...prev.goals, [activeTopic]: Math.max(0, value) },
    }))
  }

  return (
    <WidgetCard className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {store.topics.map((topic) => (
            <button
              key={topic}
              type="button"
              onClick={() => setActiveTopic(topic)}
              onContextMenu={(e) => {
                e.preventDefault()
                removeTopic(topic)
              }}
              className={[
                'rounded-full px-3 py-1 text-sm font-medium transition',
                topic === activeTopic
                  ? 'bg-accent text-white dark:bg-accent-dark dark:text-page-dark'
                  : 'bg-panel-highlight text-text-primary hover:bg-accent/10 dark:bg-panel-highlight-dark dark:text-text-primary-dark',
              ].join(' ')}
            >
              {topic}
            </button>
          ))}
          <span className="mx-1 text-sm text-text-muted">|</span>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-text-muted">Goal</span>
            <input
              type="number"
              min={0}
              value={goal || ''}
              placeholder="—"
              onChange={(e) => setGoal(Number(e.target.value) || 0)}
              className="w-12 rounded border border-panel-highlight bg-transparent px-1 py-0.5 text-center text-sm text-text-primary outline-none transition focus:border-accent dark:border-panel-highlight-dark dark:text-text-primary-dark dark:focus:border-accent-dark [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            {goal > 0 && (
              <span className={goalMet ? 'text-emerald-500' : 'text-amber-500'}>
                ({total}/{goal})
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={addTopic}
            className="rounded-full px-3 py-1 text-sm font-medium text-text-muted transition hover:bg-panel-highlight dark:hover:bg-panel-highlight-dark"
          >
            + New
          </button>
        </div>

        {selected && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-muted">{formatKey(selected)}</span>
            <button
              type="button"
              onClick={() => selected && setValue(selected, -1)}
              className="rounded-lg bg-panel-highlight p-1 text-text-primary transition hover:bg-accent/10 dark:bg-panel-highlight-dark dark:text-text-primary-dark"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-[1.5rem] text-center font-mono text-sm text-text-primary dark:text-text-primary-dark">
              {selectedValue}
            </span>
            <button
              type="button"
              onClick={() => selected && setValue(selected, 1)}
              className="rounded-lg bg-panel-highlight p-1 text-text-primary transition hover:bg-accent/10 dark:bg-panel-highlight-dark dark:text-text-primary-dark"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <div className="relative">
          <div className="pointer-events-none absolute -top-5 left-0 flex h-4 w-full">
            {monthLabels.map(({ weekIdx, label }) => (
              <span
                key={`${label}-${weekIdx}`}
                className="absolute text-[10px] text-text-muted"
                style={{ left: `${weekIdx * 13}px` }}
              >
                {label}
              </span>
            ))}
          </div>

          <div className="flex gap-[3px]">
            {weeks.map((days, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-[3px]">
                {days.map((day) => {
                  const value = getValue(day)
                  const key = formatKey(day)
                  const isSelected = selected ? formatKey(selected) === key : false
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-label={key}
                      onClick={() => setSelected(day)}
                      className={[
                        'h-[10px] w-[10px] rounded-[2px] transition',
                        intensityClass(value, goalMet),
                        isSelected
                          ? 'ring-2 ring-accent dark:ring-accent-dark'
                          : key === todayKey
                            ? 'ring-1 ring-inset ring-blue-500 dark:ring-blue-400'
                            : 'hover:ring-2 hover:ring-accent/50',
                      ].join(' ')}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 text-[10px] text-text-muted">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((v) => (
          <div key={v} className={['h-[10px] w-[10px] rounded-[2px]', intensityClass(v, goalMet)].join(' ')} />
        ))}
        <span>More</span>
      </div>
    </WidgetCard>
  )
}

function intensityClass(value: number, goalMet: boolean) {
  if (goalMet) {
    switch (value) {
      case 0:
        return 'bg-slate-200 dark:bg-slate-800'
      case 1:
        return 'bg-emerald-500/30'
      case 2:
        return 'bg-emerald-500/50'
      case 3:
        return 'bg-emerald-500/75'
      case 4:
      default:
        return 'bg-emerald-500'
    }
  }
  switch (value) {
    case 0:
      return 'bg-slate-200 dark:bg-slate-800'
    case 1:
      return 'bg-amber-500/30'
    case 2:
      return 'bg-amber-500/50'
    case 3:
      return 'bg-amber-500/75'
    case 4:
    default:
      return 'bg-amber-500'
  }
}
