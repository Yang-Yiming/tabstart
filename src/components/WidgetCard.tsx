import type { ReactNode } from 'react'

interface WidgetCardProps {
  children: ReactNode
  className?: string
}

export function WidgetCard({ children, className = '' }: WidgetCardProps) {
  return (
    <div
      className={[
        'group relative overflow-hidden rounded-3xl border border-white/15 bg-white/[0.08] p-5 shadow-2xl',
        'backdrop-blur-2xl backdrop-saturate-150',
        'transition-all duration-500 ease-out',
        'hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.12] hover:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.35)]',
        'dark:border-white/10 dark:bg-black/15 dark:hover:border-white/20 dark:hover:bg-black/20',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
