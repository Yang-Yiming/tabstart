import { useLocalStorage } from '../../hooks/useLocalStorage'

export interface TopicData {
  [dateKey: string]: number
}

export interface ActivityStore {
  topics: string[]
  data: Record<string, TopicData>
  goals: Record<string, number>
}

export interface StreakStats {
  current: number
  best: number
  today: number
  losing: number
}

export const DEFAULT_ACTIVITY_TOPICS = ['论文', '代码']
export const ACTIVITY_STORAGE_KEY = 'homepage-heatmap'

export function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function createDefaultActivityStore(): ActivityStore {
  return {
    topics: DEFAULT_ACTIVITY_TOPICS,
    data: {},
    goals: {},
  }
}

export function useActivityStore() {
  return useLocalStorage<ActivityStore>(ACTIVITY_STORAGE_KEY, createDefaultActivityStore())
}

export function getTopicValue(store: ActivityStore, topic: string, date: Date) {
  return store.data[topic]?.[formatDateKey(date)] ?? 0
}

function addDateKeyDays(key: string, days: number) {
  const date = new Date(`${key}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().split('T')[0]
}

export function calculateStreakStats(topicData: TopicData = {}, goal = 1, today = new Date()): StreakStats {
  const effectiveGoal = Math.max(1, goal)
  const normalizedToday = new Date(today)
  normalizedToday.setHours(0, 0, 0, 0)

  let current = 0
  for (let offset = 0; ; offset++) {
    const key = formatDateKey(addDays(normalizedToday, -offset))
    if ((topicData[key] ?? 0) < effectiveGoal) break
    current += 1
  }

  const activeKeys = Object.entries(topicData)
    .filter(([, value]) => value >= effectiveGoal)
    .map(([key]) => key)
    .sort()

  let best = 0
  let run = 0
  let previousKey: string | null = null

  for (const key of activeKeys) {
    if (previousKey && addDateKeyDays(previousKey, 1) === key) {
      run += 1
    } else {
      run = 1
    }
    best = Math.max(best, run)
    previousKey = key
  }

  let losing = 0
  if (activeKeys.length > 0) {
    for (let offset = 0; ; offset++) {
      const key = formatDateKey(addDays(normalizedToday, -offset))
      if ((topicData[key] ?? 0) >= effectiveGoal) break
      losing += 1
    }
  } else {
    losing = Infinity
  }

  return {
    current,
    best,
    today: topicData[formatDateKey(normalizedToday)] ?? 0,
    losing,
  }
}
