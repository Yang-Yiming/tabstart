import { Suspense, useEffect } from 'react'
import type { ComponentType } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useMountReveal } from '../hooks/useMountReveal'
import type { WidgetProps } from '../plugins/types'

interface ExpandedWidgetOverlayProps {
  /** Target widget component rendered inside the large panel. */
  component: ComponentType<WidgetProps>
  /** Display name of the target widget (dialog aria-label). */
  name: string
  /** Source instance key on the grid, reused so settings/data stay with it. */
  widgetKey: string
  onClose: () => void
}

/**
 * Full-screen layer that renders a widget "expanded" into a large centered
 * panel (iOS-folder style). Portaled to document.body: glass surfaces use
 * backdrop-filter, which would otherwise act as a containing block and break
 * fixed positioning. The widget provides its own glass card; the panel here is
 * a neutral wrapper. Mount/unmount is instant — the fade-in is gated by
 * useMountReveal to also hide the liquid-glass surface warm-up.
 */
export function ExpandedWidgetOverlay({ component: Target, name, widgetKey, onClose }: ExpandedWidgetOverlayProps) {
  const revealed = useMountReveal()

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={name}>
      <div
        className={[
          'absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ease-out',
          revealed ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        onClick={onClose}
      />

      {/* pointer-events pass through so clicks next to the panel hit the backdrop */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4 sm:p-6">
        <div
          className={[
            'group/panel pointer-events-auto relative h-[min(85vh,680px)] w-[min(92vw,940px)] max-h-full max-w-full',
            'transition-[opacity,transform] duration-300 ease-out',
            revealed ? 'scale-100 opacity-100' : 'scale-[0.96] opacity-0',
          ].join(' ')}
        >
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="absolute right-3 top-3 z-20 rounded-full border border-white/10 bg-black/45 p-1.5 text-white/65 opacity-0 shadow-lg backdrop-blur-xl transition hover:bg-white/15 hover:text-white focus-visible:opacity-100 group-hover/panel:opacity-100"
            aria-label="Close expanded widget"
            title="Close (Esc)"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="h-full [&>*]:h-full">
            <Suspense fallback={<div className="h-full animate-pulse rounded-3xl bg-black/20 backdrop-blur-xl" />}>
              <Target widgetKey={widgetKey} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
