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

export function createId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

/** Toggle an item's completion; recurring items toggle the given date's key. */
export function toggleTodoItem(items: TodoItem[], item: TodoItem, date = new Date()): TodoItem[] {
  const completionKey = recurrenceCompletionKey(item, date)
  return items.map((candidate) => {
    if (candidate.id !== item.id) return candidate
    if (!isRecurring(candidate)) {
      return { ...candidate, completedAt: candidate.completedAt ? undefined : new Date().toISOString() }
    }
    const dates = new Set(candidate.completedDates ?? [])
    if (dates.has(completionKey)) dates.delete(completionKey)
    else dates.add(completionKey)
    return { ...candidate, completedDates: [...dates] }
  })
}

/** Remove an item and unlink any children pointing at it. */
export function removeTodoItem(items: TodoItem[], id: string): TodoItem[] {
  return items
    .filter((candidate) => candidate.id !== id)
    .map((candidate) => (candidate.parentId === id ? { ...candidate, parentId: undefined } : candidate))
}

/**
 * Move an item to sit right before `beforeId` in the stored array (which is
 * the manual display order), or to the end when `beforeId` is omitted. Views
 * filter this array, so relative order within a view follows it.
 */
export function moveTodoItem(items: TodoItem[], id: string, beforeId?: string): TodoItem[] {
  const dragged = items.find((candidate) => candidate.id === id)
  if (!dragged) return items
  const without = items.filter((candidate) => candidate.id !== id)
  const index = beforeId ? without.findIndex((candidate) => candidate.id === beforeId) : -1
  if (index === -1) return [...without, dragged]
  without.splice(index, 0, dragged)
  return without
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

export function formatDateLabel(date: Date) {
  const key = formatDateKey(date)
  const today = formatDateKey(new Date())
  const tomorrow = formatDateKey(addDays(new Date(), 1))
  if (key === today) return 'Today'
  if (key === tomorrow) return 'Tomorrow'
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
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
