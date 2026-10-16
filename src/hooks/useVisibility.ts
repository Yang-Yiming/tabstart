import { useEffect, useState } from 'react'

/**
 * Whether the page is currently visible. Background tabs are throttled or
 * frozen by the browser and never paint, so interval-driven widgets subscribe
 * here and skip work while hidden — then catch up once on the way back.
 */
export function useVisibility(): boolean {
  const [visible, setVisible] = useState(() => document.visibilityState === 'visible')

  useEffect(() => {
    const handleChange = () => setVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', handleChange)
    // Re-sync: visibility can change between the initial render and mount.
    handleChange()
    return () => document.removeEventListener('visibilitychange', handleChange)
  }, [])

  return visible
}
