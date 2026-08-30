import { useSyncExternalStore } from 'react'

export const POMODORO_MODES = {
  work: 25 * 60,
  break: 5 * 60,
}

export type PomodoroMode = keyof typeof POMODORO_MODES

interface PomodoroState {
  mode: PomodoroMode
  secondsLeft: number
  running: boolean
}

/**
 * Module-level store so every mounted instance (grid widgets AND the expanded
 * panel) shows and drives the same timer — one shared interval, one state.
 */
let state: PomodoroState = { mode: 'work', secondsLeft: POMODORO_MODES.work, running: false }
let intervalId: ReturnType<typeof setInterval> | null = null
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function commit(next: PomodoroState) {
  state = next
  emit()
}

function syncInterval() {
  if (state.running && intervalId === null) {
    intervalId = setInterval(() => {
      if (state.secondsLeft <= 1) {
        clearInterval(intervalId!)
        intervalId = null
        commit({ ...state, secondsLeft: 0, running: false })
        return
      }
      commit({ ...state, secondsLeft: state.secondsLeft - 1 })
    }, 1000)
  } else if (!state.running && intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
}

function update(patch: Partial<PomodoroState>) {
  commit({ ...state, ...patch })
  syncInterval()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return state
}

export function usePomodoro() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot)

  const switchMode = (next: PomodoroMode) => {
    update({ mode: next, running: false, secondsLeft: POMODORO_MODES[next] })
  }
  const toggleMode = () => switchMode(snapshot.mode === 'work' ? 'break' : 'work')
  const reset = () => switchMode(snapshot.mode)
  const toggleRunning = () => update({ running: !snapshot.running })

  const minutes = String(Math.floor(snapshot.secondsLeft / 60)).padStart(2, '0')
  const seconds = String(snapshot.secondsLeft % 60).padStart(2, '0')

  return { mode: snapshot.mode, running: snapshot.running, minutes, seconds, switchMode, toggleMode, reset, toggleRunning }
}
