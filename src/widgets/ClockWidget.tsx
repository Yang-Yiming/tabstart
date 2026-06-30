import { useEffect, useState } from 'react'
import { WidgetCard } from '../components/WidgetCard'

export function ClockWidget() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const time = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  const date = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <WidgetCard className="flex flex-col items-center justify-center text-center">
      <div className="font-mono text-6xl font-semibold tracking-tight text-text-primary dark:text-text-primary-dark sm:text-7xl">
        {time}
      </div>
      <div className="mt-2 text-lg text-text-muted">{date}</div>
    </WidgetCard>
  )
}
