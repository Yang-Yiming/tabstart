import type { MouseEvent, ReactNode } from 'react'

interface WidgetCardProps {
  children: ReactNode
  className?: string
}

export function WidgetCard({ children, className = '' }: WidgetCardProps) {
  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    el.style.setProperty('--shine-x', `${x}%`)
    el.style.setProperty('--shine-y', `${y}%`)
  }

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
      style={{
        backgroundImage:
          'radial-gradient(circle at var(--shine-x, 50%) var(--shine-y, 0%), rgba(255,255,255,0.18) 0%, transparent 60%)',
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(circle at var(--shine-x, 50%) var(--shine-y, 0%), rgba(255,255,255,0.12) 0%, transparent 45%)',
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
