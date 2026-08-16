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
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

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
