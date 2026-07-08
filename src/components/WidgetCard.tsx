import { useContext, type MouseEvent, type ReactNode } from 'react'
import { AppearanceContext } from './AppearanceContext'
import { defaultShineConfig } from '../config/mouseHalo'

interface WidgetCardProps {
  children: ReactNode
  className?: string
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16)
  const g = parseInt(clean.substring(2, 4), 16)
  const b = parseInt(clean.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function WidgetCard({ children, className = '' }: WidgetCardProps) {
  const { shine: rawShine } = useContext(AppearanceContext)
  const shine = rawShine ?? defaultShineConfig

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    el.style.setProperty('--shine-x', `${x}%`)
    el.style.setProperty('--shine-y', `${y}%`)
  }

  const mainColor = shine.enabled
    ? hexToRgba(shine.color, shine.opacity)
    : undefined
  const hoverColor = shine.enabled
    ? hexToRgba(shine.color, shine.opacity * 0.65)
    : undefined

  return (
    <div
      onMouseMove={handleMove}
      className={[
        'group relative overflow-hidden rounded-3xl border border-white/15 bg-white/[0.08] p-5 shadow-2xl',
        'backdrop-blur-2xl backdrop-saturate-150',
        'transition-all duration-500 ease-out',
        'hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.12] hover:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.35)]',
        'dark:border-white/10 dark:bg-black/15 dark:hover:border-white/20 dark:hover:bg-black/20',
        className,
      ].join(' ')}
      style={
        mainColor
          ? {
              backgroundImage: `radial-gradient(circle at var(--shine-x, 50%) var(--shine-y, 0%), ${mainColor} 0%, transparent 60%)`,
            }
          : undefined
      }
    >
      {shine.enabled && hoverColor && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle at var(--shine-x, 50%) var(--shine-y, 0%), ${hoverColor} 0%, transparent 45%)`,
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
