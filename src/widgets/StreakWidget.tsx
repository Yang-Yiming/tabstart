import { useMemo, useState } from 'react'
import { Flame } from 'lucide-react'
import { WidgetCard } from '../components/WidgetCard'
import { addDays, calculateStreakStats, formatDateKey, useActivityStore } from './activity'
import { useWidgetSettings } from './widgetSettings'

export function StreakWidget() {
  const [store] = useActivityStore()
  const { settings } = useWidgetSettings('streak')
  const showLosing = Boolean(settings.showLosingStreak)
  const bigNumberMode = String(settings.bigNumberMode ?? 'auto')
  const [activeTopic, setActiveTopic] = useState(store.topics[0] ?? '论文')
  const topics = store.topics.length > 0 ? store.topics : ['论文']
  const safeTopic = topics.includes(activeTopic) ? activeTopic : topics[0]

  const stats = useMemo(
    () => calculateStreakStats(store.data[safeTopic] ?? {}, store.goals[safeTopic] ?? 1),
    [store.data, store.goals, safeTopic],
  )

  const showLossInBigNumber = useMemo(() => {
    if (bigNumberMode === 'loss') return true
    if (bigNumberMode === 'win') return false
    const topicData = store.data[safeTopic] ?? {}
    const effectiveGoal = Math.max(1, store.goals[safeTopic] ?? 1)
    const todayDate = new Date()
    todayDate.setHours(0, 0, 0, 0)
    const yesterdayKey = formatDateKey(addDays(todayDate, -1))
    const yesterdayDone = (topicData[yesterdayKey] ?? 0) >= effectiveGoal
    return !yesterdayDone && stats.today < effectiveGoal
  }, [bigNumberMode, store.data, store.goals, safeTopic, stats.today])

  const switchTopic = () => {
    const currentIndex = topics.indexOf(safeTopic)
    setActiveTopic(topics[(currentIndex + 1) % topics.length])
  }

  return (
    <WidgetCard className="h-full p-3">
      <div className="flex h-full flex-col justify-between gap-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white/45">
            <Flame className="h-3 w-3 text-amber-200/80" />
            Streak
          </div>
          <button
            type="button"
            onClick={switchTopic}
            className="max-w-16 truncate rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/75 transition hover:bg-white/15 hover:text-white"
            title="Switch topic"
          >
            {safeTopic}
          </button>
        </div>

        <div className="flex items-end gap-1.5">
          <div
            className={[
              'font-mono text-4xl font-semibold leading-none',
              showLossInBigNumber ? 'text-rose-300' : 'text-white',
            ].join(' ')}
          >
            {showLossInBigNumber ? (stats.losing === Infinity ? '∞' : stats.losing) : stats.current}
          </div>
          <div className="pb-1 text-xs font-medium text-white/55">days</div>
        </div>

        <div className="flex items-center justify-between gap-2 text-[11px]">
          <div className="flex items-baseline gap-1">
            <span className="text-white/35">Best</span>
            <span className="font-mono font-semibold text-white/80">{stats.best}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-white/35">Today</span>
            <span className="font-mono font-semibold text-amber-200">{stats.today}</span>
          </div>
          {showLosing && !showLossInBigNumber && (
            <div className="flex items-baseline gap-1" title="Consecutive days without reaching the goal">
              <span className="text-white/35">连败</span>
              <span className="font-mono font-semibold text-rose-300">
                {stats.losing === Infinity ? '∞' : stats.losing}
              </span>
            </div>
          )}
        </div>
      </div>
    </WidgetCard>
  )
}
