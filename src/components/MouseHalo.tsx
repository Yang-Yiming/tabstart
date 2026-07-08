import { useEffect, useRef, useState } from 'react'
import type { MouseHaloConfig } from '../config/mouseHalo'

export function MouseHalo({ config }: { config: MouseHaloConfig }) {
  const targetRef = useRef({ x: 0, y: 0 })
  const currentRef = useRef({ x: 0, y: 0 })
  const rafRef = useRef<number | null>(null)
  const haloRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const onMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useEffect(() => {
    const animate = () => {
      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * config.smooth
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * config.smooth
      if (haloRef.current) {
        haloRef.current.style.transform = `translate(${currentRef.current.x}px, ${currentRef.current.y}px) translate(-50%, -50%)`
      }
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [config.smooth])

  if (!mounted) return null

  return (
    <div
      ref={haloRef}
      className="pointer-events-none fixed left-0 top-0 z-[15] transition-opacity duration-300"
      style={{
        width: config.size,
        height: config.size,
        background: `radial-gradient(circle, ${config.color} 0%, transparent 70%)`,
        opacity: config.enabled ? config.opacity : 0,
        filter: `blur(${config.blur}px)`,
        mixBlendMode: config.blendMode,
        borderRadius: '50%',
      }}
    />
  )
}
