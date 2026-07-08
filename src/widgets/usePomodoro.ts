import { useEffect, useState } from 'react'

export const POMODORO_MODES = {
  work: 25 * 60,
  break: 5 * 60,
}

export type PomodoroMode = keyof typeof POMODORO_MODES

export function usePomodoro() {
  const [mode, setMode] = useState<PomodoroMode>('work')
  const [secondsLeft, setSecondsLeft] = useState(POMODORO_MODES.work)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setRunning(false)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [running])

  const switchMode = (next: PomodoroMode) => {
    setMode(next)
    setRunning(false)
    setSecondsLeft(POMODORO_MODES[next])
  }

  const toggleMode = () => {
    switchMode(mode === 'work' ? 'break' : 'work')
  }

  const reset = () => switchMode(mode)
  const toggleRunning = () => setRunning((r) => !r)

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const seconds = String(secondsLeft % 60).padStart(2, '0')

  return { mode, running, minutes, seconds, switchMode, toggleMode, reset, toggleRunning }
}
