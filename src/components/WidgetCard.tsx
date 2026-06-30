import type { ReactNode } from 'react'

interface WidgetCardProps {
  children: ReactNode
  className?: string
}

export function WidgetCard({ children, className = '' }: WidgetCardProps) {
  return (
    <div
      className={[
        'rounded-2xl border border-border bg-panel p-5 shadow-sm backdrop-blur-md',
        'transition duration-300 hover:border-accent/30 hover:-translate-y-0.5',
        'dark:border-border-dark dark:bg-panel-dark dark:shadow-xl',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
