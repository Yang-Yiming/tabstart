import type { ReactNode } from 'react'
import { ThemeSurface } from './ThemeSurface'

interface WidgetCardProps {
  children: ReactNode
  className?: string
}

export function WidgetCard({ children, className = '' }: WidgetCardProps) {
  return (
    <ThemeSurface
      fallbackClassName="widget-card border"
      className={[
        'group relative overflow-hidden rounded-3xl p-5 shadow-2xl',
        'transition-all duration-500 ease-out hover:-translate-y-1',
        className,
      ].join(' ')}
    >
      {children}
    </ThemeSurface>
  )
}
