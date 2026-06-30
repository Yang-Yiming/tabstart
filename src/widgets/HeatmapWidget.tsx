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
}

const DEFAULT_TOPICS = ['论文', '代码']
const WEEKS = 24
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
  })
  const [activeTopic, setActiveTopic] = useState(store.topics[0] ?? DEFAULT_TOPICS[0])
  const [selected, setSelected] = useState<Date | null>(null)

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
      delete data[topic]
      return { topics, data }
    })
    if (activeTopic === topic) {
      setActiveTopic(store.topics.find((t) => t !== topic) ?? '')
    }
  }

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const selectedValue = selected ? getValue(selected) : 0

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
        <div className="flex flex-col gap-1.5">
          <div className="h-3.5" />
          {dayLabels.map((label) => (
            <div key={label} className="h-3.5 text-[10px] leading-[14px] text-text-muted">
              {label[0]}
            </div>
          ))}
        </div>
        {weeks.map((days, weekIdx) => (
          <div key={weekIdx} className="flex flex-col gap-1.5">
            {(() => {
              const firstDayOfWeek = days[0]
              const showMonth = firstDayOfWeek.getDate() <= 7
              return (
                <div className="h-3.5">
                  {showMonth && (
                    <span className="whitespace-nowrap text-[10px] text-text-muted">
                      {firstDayOfWeek.toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                  )}
                </div>
              )
            })()}
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
                    'h-3.5 w-3.5 rounded-sm transition',
                    intensityClass(value),
                    isSelected
                      ? 'ring-2 ring-accent dark:ring-accent-dark'
                      : 'hover:ring-2 hover:ring-accent/50',
                  ].join(' ')}
                />
              )
            })}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs text-text-muted">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((v) => (
          <div key={v} className={['h-3.5 w-3.5 rounded-sm', intensityClass(v)].join(' ')} />
        ))}
        <span>More</span>
      </div>
    </WidgetCard>
  )
}

function intensityClass(value: number) {
  const base = 'bg-emerald-500'
  switch (value) {
    case 0:
      return 'bg-slate-200 dark:bg-panel-highlight-dark'
    case 1:
      return `${base}/30`
    case 2:
      return `${base}/50`
    case 3:
      return `${base}/75`
    case 4:
    default:
      return base
  }
}
