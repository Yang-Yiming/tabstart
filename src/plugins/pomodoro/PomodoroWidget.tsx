import { Pause, Play, RotateCcw, Timer } from 'lucide-react'
import { WidgetCard } from '../../components/WidgetCard'
import { POMODORO_MODES, usePomodoro, type PomodoroMode } from './usePomodoro'

export function PomodoroCompactWidget() {
  const { mode, running, minutes, seconds, toggleMode, reset, toggleRunning } = usePomodoro()

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
            onClick={toggleRunning}
            className="flex flex-1 items-center justify-center rounded-lg bg-white/10 py-1.5 text-white transition hover:bg-white/20"
          >
            {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={reset}
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

export function PomodoroLargeWidget() {
  const { mode, running, minutes, seconds, switchMode, reset, toggleRunning } = usePomodoro()

  return (
    <WidgetCard className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <div className="flex gap-1 rounded-xl bg-white/10 p-1">
        {(Object.keys(POMODORO_MODES) as PomodoroMode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => switchMode(m)}
            className={[
              'rounded-lg px-3 py-1 text-xs font-medium transition',
              mode === m ? 'bg-white text-text-primary shadow-sm' : 'text-white/70 hover:text-white',
            ].join(' ')}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="font-mono text-5xl font-semibold text-white">
        {minutes}:{seconds}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={toggleRunning}
          className="rounded-xl bg-white/10 p-2 text-white transition hover:bg-white/20"
        >
          {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-white/10 p-2 text-white transition hover:bg-white/20"
        >
          <RotateCcw className="h-5 w-5" />
        </button>
      </div>
    </WidgetCard>
  )
}
