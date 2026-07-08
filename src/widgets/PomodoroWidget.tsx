import { useEffect, useState } from 'react'
import { Pause, Play, RotateCcw, Timer } from 'lucide-react'
import { WidgetCard } from '../components/WidgetCard'

const MODES = {
  work: 25 * 60,
  break: 5 * 60,
}

export function PomodoroWidget() {
  const [mode, setMode] = useState<keyof typeof MODES>('work')
  const [secondsLeft, setSecondsLeft] = useState(MODES.work)
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

  const switchMode = (next: keyof typeof MODES) => {
    setMode(next)
    setRunning(false)
    setSecondsLeft(MODES[next])
  }

  const toggleMode = () => {
    switchMode(mode === 'work' ? 'break' : 'work')
  }

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const seconds = String(secondsLeft % 60).padStart(2, '0')

  return (
    <WidgetCard className="h-full p-3">
      <div className="flex h-full flex-col justify-between gap-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white/45">
            <Timer className="h-3 w-3 text-sky-200/80" />
            Pomodoro
          </div>
          <button
            type="button"
            onClick={toggleMode}
            className="max-w-16 truncate rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/75 transition hover:bg-white/15 hover:text-white"
            title="Switch mode"
          >
            {mode}
          </button>
        </div>

        <div className="font-mono text-3xl font-semibold leading-none text-white">
          {minutes}:{seconds}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            className="flex flex-1 items-center justify-center rounded-lg bg-white/10 py-1.5 text-white transition hover:bg-white/20"
          >
            {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => switchMode(mode)}
            className="rounded-lg bg-white/10 p-1 text-white/75 transition hover:bg-white/20 hover:text-white"
            title="Reset"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </WidgetCard>
  )
}
