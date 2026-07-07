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
      <div className="text-6xl font-light tracking-tight text-white drop-shadow-lg sm:text-7xl md:text-8xl">
        {time}
      </div>
      <div className="mt-3 text-lg font-light tracking-wide text-white/80 drop-shadow-md">
        {date}
      </div>
    </div>
  )
}
