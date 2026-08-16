import type { ReactNode } from 'react'
import { useMountReveal } from '../hooks/useMountReveal'

interface RevealOnMountProps {
  children: ReactNode
  className?: string
  onClose?: () => void
}

/**
 * Wraps a subtree that mounts on demand (e.g. `{open && ...}`) and fades it in
 * a few frames AFTER mount. This hides the liquid-glass surface's warm-up: the
 * SVG-filter refraction only becomes active a frame or two after DOM insertion,
 * so showing the panel immediately would flash the plain, unfiltered panel
 * first and then "pop" into the liquid-glass look.
 *
 * Must be mounted/unmounted together with the subtree it reveals (i.e. placed
 * *inside* the conditional), otherwise the reveal state persists across opens.
 */
export function RevealOnMount({ children, className = '', onClose }: RevealOnMountProps) {
  const revealed = useMountReveal()

  return (
    <div
      className={[
        className,
        'transition-opacity duration-200 ease-out',
        revealed ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
      onClick={onClose}
    >
      {children}
    </div>
  )
}