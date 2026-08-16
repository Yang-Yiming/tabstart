import type { ReactNode } from 'react'

interface WidgetCardProps {
  children: ReactNode
  className?: string
}

export function WidgetCard({ children, className = '' }: WidgetCardProps) {
  return (
    <div
      className={[
        'widget-card group relative overflow-hidden rounded-3xl border p-5 shadow-2xl',
        'transition-all duration-500 ease-out hover:-translate-y-1',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
