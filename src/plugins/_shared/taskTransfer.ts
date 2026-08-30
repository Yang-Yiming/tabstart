import type { DragEvent } from 'react'
import type { KanbanColumnId, KanbanStore, KanbanTask } from '../kanban/kanban'
import { isCompleted } from '../todo/todo'
import type { TodoHorizon, TodoItem, TodoStore } from '../todo/todo'

export interface DraggedTask {
  source: 'todo' | 'kanban'
  id: string
}

export const DRAG_MIME = 'application/x-tabstart-task'

/**
 * Last task drag started via setDragData. dataTransfer.getData is off-limits
 * during dragover (protected mode), so handlers that must behave differently
 * for internal todo reordering vs. cross-widget transfers read this instead.
 */
let activeDrag: DraggedTask | null = null

export function setDragData(event: DragEvent, drag: DraggedTask) {
  activeDrag = drag
  const payload = JSON.stringify(drag)
  event.dataTransfer.setData(DRAG_MIME, payload)
  event.dataTransfer.setData('text/plain', payload)
}

export function getActiveDrag(): DraggedTask | null {
  return activeDrag
}

export function clearActiveDrag() {
  activeDrag = null
}

export function getDragData(event: DragEvent): DraggedTask | null {
  const raw = event.dataTransfer.getData(DRAG_MIME) || event.dataTransfer.getData('text/plain')
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (parsed && (parsed.source === 'todo' || parsed.source === 'kanban') && typeof parsed.id === 'string') {
      return parsed as DraggedTask
    }
  } catch {
    return null
  }
  return null
}

export function isTaskDrag(event: DragEvent) {
  const types = event.dataTransfer.types
  return types.includes(DRAG_MIME) || types.includes('text/plain')
}

export function transferTodoToKanban(
  todoStore: TodoStore,
  kanbanStore: KanbanStore,
  taskId: string,
  column: KanbanColumnId,
): { todo: TodoStore; kanban: KanbanStore } {
  const item = todoStore.items.find((candidate) => candidate.id === taskId)
  if (!item) return { todo: todoStore, kanban: kanbanStore }

  const targetColumn = isCompleted(item) ? 'done' : column
  const task: KanbanTask = {
    id: item.id,
    title: item.title,
    column: targetColumn,
    createdAt: item.createdAt,
    completedAt: targetColumn === 'done' ? (item.completedAt ?? new Date().toISOString()) : undefined,
  }
  return {
    todo: { items: todoStore.items.filter((candidate) => candidate.id !== taskId) },
    kanban: { tasks: [...kanbanStore.tasks, task] },
  }
}

export function transferKanbanToTodo(
  kanbanStore: KanbanStore,
  todoStore: TodoStore,
  taskId: string,
  horizon: TodoHorizon,
  scheduledDate?: string,
): { kanban: KanbanStore; todo: TodoStore } {
  const task = kanbanStore.tasks.find((candidate) => candidate.id === taskId)
  if (!task) return { kanban: kanbanStore, todo: todoStore }

  const done = task.column === 'done'
  const item: TodoItem = {
    id: task.id,
    title: task.title,
    horizon,
    recurrence: 'none',
    scheduledDate: horizon === 'daily' ? scheduledDate : undefined,
    createdAt: task.createdAt,
    completedAt: done ? (task.completedAt ?? new Date().toISOString()) : undefined,
  }
  return {
    kanban: { tasks: kanbanStore.tasks.filter((candidate) => candidate.id !== taskId) },
    todo: { items: [...todoStore.items, item] },
  }
}
