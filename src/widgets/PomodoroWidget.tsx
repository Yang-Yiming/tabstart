import { useEffect, useState } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
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

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const seconds = String(secondsLeft % 60).padStart(2, '0')

  return (
    <WidgetCard className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <div className="flex gap-2 rounded-lg bg-panel-highlight p-1 dark:bg-panel-highlight-dark">
        {(Object.keys(MODES) as Array<keyof typeof MODES>).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={[
              'rounded-md px-3 py-1 text-xs font-medium transition',
              mode === m
                ? 'bg-accent text-white dark:bg-accent-dark dark:text-page-dark'
                : 'text-text-muted hover:text-text-primary dark:hover:text-text-primary-dark',
            ].join(' ')}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="font-mono text-5xl font-semibold text-text-primary dark:text-text-primary-dark">
        {minutes}:{seconds}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className="rounded-lg bg-accent p-2 text-white transition hover:bg-accent/90 dark:bg-accent-dark dark:text-page-dark"
        >
          {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>
        <button
          type="button"
          onClick={() => switchMode(mode)}
          className="rounded-lg bg-panel-highlight p-2 text-text-primary transition hover:bg-accent/10 dark:bg-panel-highlight-dark dark:text-text-primary-dark"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
      </div>
    </WidgetCard>
  )
}
