import { useLocalStorage } from '../../hooks/useLocalStorage'
import { formatDateKey } from '../_shared/activity'

export type TodoHorizon = 'daily' | 'weekly' | 'goal'
export type TodoRecurrence = 'none' | 'daily' | 'weekdays' | 'weekly'

export interface TodoItem {
  id: string
  title: string
  horizon: TodoHorizon
  parentId?: string
  scheduledDate?: string
  recurrence: TodoRecurrence
  createdAt: string
  completedAt?: string
  completedDates?: string[]
}

export interface TodoStore {
  items: TodoItem[]
}

export const TODO_STORAGE_KEY = 'homepage-todos-v1'

export function createDefaultTodoStore(): TodoStore {
  return {
    items: [
      {
        id: 'welcome-daily',
        title: 'Plan the day',
        horizon: 'daily',
        recurrence: 'daily',
        createdAt: new Date().toISOString(),
        completedDates: [],
      },
    ],
  }
}

export function useTodoStore() {
  return useLocalStorage<TodoStore>(TODO_STORAGE_KEY, createDefaultTodoStore(), { debounceMs: 200 })
}

export function isRecurring(item: TodoItem) {
  return item.recurrence !== 'none'
}

export function recurrenceCompletionKey(item: TodoItem, date = new Date()) {
  if (item.recurrence !== 'weekly') return formatDateKey(date)
  const monday = new Date(date)
  const weekday = monday.getDay() === 0 ? 6 : monday.getDay() - 1
  monday.setDate(monday.getDate() - weekday)
  return `week:${formatDateKey(monday)}`
}

export function isCompleted(item: TodoItem, date = new Date()) {
  if (!isRecurring(item)) return Boolean(item.completedAt)
  return item.completedDates?.includes(recurrenceCompletionKey(item, date)) ?? false
}

export function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function dateFromKey(key: string) {
  return new Date(`${key}T12:00:00`)
}

function startDate(item: TodoItem) {
  return item.scheduledDate ?? formatDateKey(new Date(item.createdAt))
}

export function isScheduledForDate(item: TodoItem, date = new Date()) {
  if (item.horizon !== 'daily') return false
  const targetKey = formatDateKey(date)
  const startKey = startDate(item)
  if (targetKey < startKey) return false
  if (item.recurrence === 'none') return targetKey === startKey
  if (item.recurrence === 'weekly') return date.getDay() === dateFromKey(startKey).getDay()
  if (item.recurrence === 'weekdays') {
    const day = date.getDay()
    return day !== 0 && day !== 6
  }
  return true
}

export function isOverdue(item: TodoItem, today = new Date()) {
  if (item.horizon !== 'daily' || isRecurring(item) || isCompleted(item)) return false
  return startDate(item) < formatDateKey(today)
}
