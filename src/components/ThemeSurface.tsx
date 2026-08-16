import type { HTMLAttributes } from 'react'
import { useActiveTheme } from '../plugins/hooks'

interface ThemeSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  fallbackClassName?: string
}

export function ThemeSurface({ fallbackClassName, className, children, ...props }: ThemeSurfaceProps) {
  const { activeTheme } = useActiveTheme()
  const Surface = activeTheme?.surface

  if (Surface === undefined || Surface === null) {
    return (
      <div {...props} className={[fallbackClassName, className].filter(Boolean).join(' ')}>
        {children}
      </div>
    )
  }

  return (
    <Surface {...props} className={[className].filter(Boolean).join(' ')}>
      {children}
    </Surface>
  )
}
