import { useEffect, useState } from 'react'

/**
 * Returns `true` only after the subtree has been mounted for a few animation
 * frames. Used to gate the reveal of panels whose first paint is not yet
 * final: the liquid-glass surface's SVG-filter refraction needs a frame or two
 * after DOM insertion to activate, and its ResizeObserver-driven displacement
 * map needs a frame to settle against the real panel size. Revealing before
 * that makes the panel flash in its plain (unfiltered) form first, then
 * "pop" into the liquid-glass look — this hook hides that warm-up.
 */
export function useMountReveal(frameCount = 3): boolean {
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    let frame = 0
    let raf = 0

    const tick = () => {
      frame += 1
      if (frame >= frameCount) {
        setRevealed(true)
        return
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [frameCount])

  return revealed
}