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
/**
 * Wall-clock deadline of the running countdown. The tick derives `secondsLeft`
 * from it instead of decrementing, so time spent in a throttled hidden tab is
 * not lost — a running pomodoro still measures real elapsed time.
 */
let endsAt = 0
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function commit(next: PomodoroState) {
  state = next
  emit()
}

function tick() {
  const secondsLeft = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
  if (secondsLeft <= 0) {
    stopInterval()
    commit({ ...state, secondsLeft: 0, running: false })
    return
  }
  if (secondsLeft !== state.secondsLeft) commit({ ...state, secondsLeft })
}

function stopInterval() {
  if (intervalId === null) return
  clearInterval(intervalId)
  intervalId = null
  document.removeEventListener('visibilitychange', handleVisibility)
}

/** Recompute from the deadline the moment the tab is shown again. */
function handleVisibility() {
  if (!document.hidden) tick()
}

function syncInterval() {
  if (state.running && intervalId === null) {
    endsAt = Date.now() + state.secondsLeft * 1000
    // Hidden tabs are throttled and never paint: skip the tick and catch up on
    // `visibilitychange` rather than burning wakeups in the background.
    document.addEventListener('visibilitychange', handleVisibility)
    intervalId = setInterval(() => {
      if (!document.hidden) tick()
    }, 1000)
  } else if (!state.running && intervalId !== null) {
    stopInterval()
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
