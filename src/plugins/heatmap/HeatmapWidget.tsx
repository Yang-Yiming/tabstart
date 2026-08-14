import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { Check, Minus, Plus } from 'lucide-react'
import { WidgetCard } from '../../components/WidgetCard'
import {
  DEFAULT_ACTIVITY_TOPICS,
  addDays,
  formatDateKey,
  getTopicValue,
  useActivityStore,
} from '../_shared/activity'

const WEEKS = 53

export function HeatmapWidget() {
  const [store, setStore] = useActivityStore()
  const [activeTopic, setActiveTopic] = useState(store.topics[0] ?? DEFAULT_ACTIVITY_TOPICS[0])
  const [selected, setSelected] = useState<Date | null>(null)
  const [justAdded, setJustAdded] = useState(false)

  // Topics can be removed from Settings → Widgets while this widget is
  // mounted; fall back to a valid topic so the grid never targets a deleted one.
  useEffect(() => {
    if (!store.topics.includes(activeTopic)) {
      setActiveTopic(store.topics[0] ?? DEFAULT_ACTIVITY_TOPICS[0])
    }
  }, [store.topics, activeTopic])

  const todayKey = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return formatDateKey(d)
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
    return getTopicValue(store, activeTopic, date)
  }

  const setValue = (date: Date, delta: number) => {
    const key = formatDateKey(date)
    setStore((prev) => {
      const topicData = { ...(prev.data[activeTopic] ?? {}) }
      const next = Math.max(0, (topicData[key] ?? 0) + delta)
      topicData[key] = next
      return { ...prev, data: { ...prev.data, [activeTopic]: topicData } }
    })
  }

  const selectedValue = selected ? getValue(selected) : 0

  const goal = store.goals[activeTopic] ?? 0
  const today = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])
  const todayValue = getValue(today)

  const incrementToday = () => {
    setValue(today, 1)
    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 500)
  }

  return (
    <WidgetCard className="h-full p-4">
      <div className="flex h-full flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {store.topics.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => setActiveTopic(topic)}
                className={[
                  'rounded-full px-3 py-1 text-sm font-medium transition',
                  topic === activeTopic
                    ? 'bg-white/25 text-white'
                    : 'bg-white/10 text-white/80 hover:bg-white/15',
                ].join(' ')}
              >
                {topic}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-end gap-1.5 text-sm">
            <div className="flex h-9 items-center rounded-full border border-white/15 bg-black/10 pl-3 text-white shadow-sm backdrop-blur-md">
              <button
                type="button"
                onClick={() => setSelected(today)}
                className="flex h-full items-center gap-2 pr-2 text-white/70 transition hover:text-white"
                aria-label={`Today: ${todayValue}${goal > 0 ? ` of ${goal}` : ''}. Edit value`}
                title="Edit today's count"
              >
                <span className="text-[11px] font-medium uppercase text-white/45">Today</span>
                <span className="min-w-5 font-mono text-sm font-semibold text-white">
                  {todayValue}{goal > 0 && <span className="font-normal text-white/35">/{goal}</span>}
                </span>
              </button>
              <button
                type="button"
                onClick={incrementToday}
                className="mr-0.5 grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white active:scale-90"
                aria-label={`Add one to ${activeTopic} today`}
                title={`Add one to ${activeTopic} today`}
              >
                {justAdded ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              </button>
            </div>
            {selected && (
              <div className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1">
                <span className="font-mono text-xs text-white/50">{formatDateKey(selected)}</span>
                <button
                  type="button"
                  onClick={() => selected && setValue(selected, -1)}
                  className="rounded-full p-0.5 text-white/55 transition hover:bg-white/15 hover:text-white"
                  aria-label="Decrease selected day"
                  title="Decrease selected day"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-4 text-center font-mono text-xs text-white">{selectedValue}</span>
                <button
                  type="button"
                  onClick={() => selected && setValue(selected, 1)}
                  className="rounded-full p-0.5 text-white/55 transition hover:bg-white/15 hover:text-white"
                  aria-label="Increase selected day"
                  title="Increase selected day"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1 overflow-x-auto px-0.5 pb-0.5">
          <div className="min-w-[680px]">
            <div className="relative h-4">
              {monthLabels.map(({ weekIdx, label }) => (
                <span
                  key={`${label}-${weekIdx}`}
                  className="absolute text-xs text-white/50"
                  style={{ left: `${(weekIdx / WEEKS) * 100}%` }}
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-[repeat(53,minmax(0,1fr))] gap-[4px]">
              {weeks.map((days, weekIdx) => (
                <div key={weekIdx} className="flex flex-col gap-[4px]">
                  {days.map((day) => {
                    const value = getValue(day)
                    const key = formatDateKey(day)
                    const isSelected = selected ? formatDateKey(selected) === key : false
                    return (
                      <button
                        key={key}
                        type="button"
                        aria-label={`${key}: ${value}`}
                        onClick={() => setSelected(day)}
                        style={intensityStyle(value, goal)}
                        className={[
                          'aspect-square w-full rounded-[3px] transition',
                          isSelected
                            ? 'ring-2 ring-white/80'
                            : key === todayKey
                              ? 'ring-1 ring-inset ring-white/60'
                              : 'hover:ring-2 hover:ring-white/40',
                        ].join(' ')}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 text-[10px] text-white/50">
          <span>Less</span>
          {legendValues(goal).map((v, i) => (
            <div key={i} className="h-3 w-3 rounded-[3px]" style={intensityStyle(v, goal)} />
          ))}
          <span>More</span>
        </div>
      </div>
    </WidgetCard>
  )
}

function intensityStyle(value: number, goal: number): CSSProperties {
  if (goal <= 0) {
    if (value === 0) return { backgroundColor: 'rgba(255,255,255,0.1)' }
    const opacity = Math.min(0.1 + 0.15 * value, 1)
    return { backgroundColor: `rgba(252,211,77,${opacity.toFixed(2)})` }
  }

  if (value < goal) {
    const opacity = 0.1 + 0.9 * (value / goal)
    return { backgroundColor: `rgba(252,211,77,${opacity.toFixed(2)})` }
  }

  const ratio = Math.min((value - goal) / goal, 1)
  const r = Math.round(110 - 105 * ratio)
  const g = Math.round(231 - 81 * ratio)
  const b = Math.round(183 - 78 * ratio)
  return { backgroundColor: `rgb(${r},${g},${b})` }
}

function legendValues(goal: number): number[] {
  if (goal <= 0) return [0, 1, 2, 3, 4]
  return [
    0,
    Math.max(1, Math.round(goal * 0.33)),
    goal,
    Math.round(goal * 1.5),
    goal * 2,
  ]
}
