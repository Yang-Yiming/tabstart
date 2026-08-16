import { useEffect, useState } from 'react'

export function ClockWidget() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const time = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const date = now.toLocaleDateString('zh-CN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="clock-time text-6xl font-light tracking-tight drop-shadow-lg sm:text-7xl md:text-8xl">
        {time}
      </div>
      <div className="clock-date mt-1 text-lg font-light tracking-wide drop-shadow-md">
        {date}
      </div>
    </div>
  )
}
