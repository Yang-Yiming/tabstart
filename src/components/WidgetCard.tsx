import type { ReactNode } from 'react'

interface WidgetCardProps {
  children: ReactNode
  className?: string
}

export function WidgetCard({ children, className = '' }: WidgetCardProps) {
  return (
    <div
      className={[
        'rounded-2xl border border-white/5 bg-panel/80 p-5 shadow-xl backdrop-blur-md',
        'transition duration-300 hover:border-cyan/30 hover:-translate-y-0.5',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
