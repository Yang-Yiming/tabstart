import { useLocalStorage } from '../hooks/useLocalStorage'

export type KanbanColumnId = 'todo' | 'doing' | 'done'

export const KANBAN_COLUMNS: KanbanColumnId[] = ['todo', 'doing', 'done']

export interface KanbanTask {
  id: string
  title: string
  column: KanbanColumnId
  createdAt: string
  completedAt?: string
  completedFrom?: KanbanColumnId
}

export interface KanbanStore {
  tasks: KanbanTask[]
}

export const KANBAN_STORAGE_KEY = 'homepage-kanban-v1'

export function createDefaultKanbanStore(): KanbanStore {
  return {
    tasks: [
      {
        id: 'welcome-kanban-drag',
        title: 'Drag cards between columns',
        column: 'todo',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'welcome-kanban-compact',
        title: 'Press ] to move to the next column',
        column: 'doing',
        createdAt: new Date().toISOString(),
      },
    ],
  }
}

export function useKanbanStore() {
  return useLocalStorage<KanbanStore>(KANBAN_STORAGE_KEY, createDefaultKanbanStore(), { debounceMs: 200 })
}

export function nextColumn(column: KanbanColumnId): KanbanColumnId {
  return KANBAN_COLUMNS[(KANBAN_COLUMNS.indexOf(column) + 1) % KANBAN_COLUMNS.length]
}

export function prevColumn(column: KanbanColumnId): KanbanColumnId {
  return KANBAN_COLUMNS[(KANBAN_COLUMNS.indexOf(column) + KANBAN_COLUMNS.length - 1) % KANBAN_COLUMNS.length]
}

function withColumn(task: KanbanTask, column: KanbanColumnId): KanbanTask {
  if (column === task.column) return task
  return {
    ...task,
    column,
    completedAt: column === 'done' ? task.completedAt ?? new Date().toISOString() : undefined,
    completedFrom: column === 'done' ? task.completedFrom ?? task.column : undefined,
  }
}

export function moveTask(
  tasks: KanbanTask[],
  taskId: string,
  toColumn: KanbanColumnId,
  beforeTaskId?: string,
): KanbanTask[] {
  const task = tasks.find((candidate) => candidate.id === taskId)
  if (!task || toColumn === task.column && beforeTaskId === taskId) return tasks

  const without = tasks.filter((candidate) => candidate.id !== taskId)
  const updated = withColumn(task, toColumn)

  const before = without.find((candidate) => candidate.id === beforeTaskId)
  const beforeIndex = before ? without.indexOf(before) : without.length
  const result = [...without]
  result.splice(beforeIndex, 0, updated)
  return result
}

export function moveTaskToNextColumn(tasks: KanbanTask[], taskId: string): KanbanTask[] {
  const task = tasks.find((candidate) => candidate.id === taskId)
  if (!task) return tasks
  return moveTask(tasks, taskId, nextColumn(task.column))
}

export function moveTaskToPrevColumn(tasks: KanbanTask[], taskId: string): KanbanTask[] {
  const task = tasks.find((candidate) => candidate.id === taskId)
  if (!task) return tasks
  return moveTask(tasks, taskId, prevColumn(task.column))
}

export function toggleTaskComplete(tasks: KanbanTask[], taskId: string): KanbanTask[] {
  const task = tasks.find((candidate) => candidate.id === taskId)
  if (!task) return tasks
  if (task.column === 'done') {
    return moveTask(tasks, taskId, task.completedFrom ?? 'todo')
  }
  return moveTask(tasks, taskId, 'done')
}
