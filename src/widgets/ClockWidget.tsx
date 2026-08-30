import { useEffect, useState } from 'react'
import {
  CLOCK_SETTINGS_KEY,
  DEFAULT_CLOCK_SETTINGS,
  normalizeClockSettings,
} from '../config/preferences'
import { useLocalStorage } from '../hooks/useLocalStorage'

export function ClockWidget() {
  const [rawSettings] = useLocalStorage(CLOCK_SETTINGS_KEY, DEFAULT_CLOCK_SETTINGS)
  const settings = normalizeClockSettings(rawSettings)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    if (settings.showSeconds) {
      const id = setInterval(() => setNow(new Date()), 1000)
      return () => clearInterval(id)
    }

    // Without seconds there is nothing to show between minute flips, so tick
    // once aligned to the next wall-clock minute (plus a small buffer) and
    // reschedule from there — 1 render/minute instead of 60/minute.
    let timeout: number
    const schedule = () => {
      const delay = 60_000 - (Date.now() % 60_000) + 50
      timeout = window.setTimeout(() => {
        setNow(new Date())
        schedule()
      }, delay)
    }
    schedule()
    return () => window.clearTimeout(timeout)
  }, [settings.showSeconds])

  const time = now.toLocaleTimeString(settings.locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: settings.showSeconds ? '2-digit' : undefined,
    hour12: settings.hour12,
  })

  const date = now.toLocaleDateString(settings.locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="clock-time text-6xl font-light tracking-tight drop-shadow-lg sm:text-7xl md:text-8xl">
        {time}
      </div>
      {settings.showDate && (
        <div className="clock-date mt-1 text-lg font-light tracking-wide drop-shadow-md">
          {date}
        </div>
      )}
    </div>
  )
}
