import { Suspense } from 'react'
import type { ResolvedVariant } from '../widgets/types'

const CELL = 112
const GAP = 16
const MAX_W = 240
const MAX_H = 150

interface Props {
  variant: ResolvedVariant
  onClick: () => void
}

export function WidgetPreview({ variant, onClick }: Props) {
  const fullW = variant.defaultW * CELL + (variant.defaultW - 1) * GAP
  const fullH = variant.defaultH * CELL + (variant.defaultH - 1) * GAP
  const scale = Math.min(MAX_W / fullW, MAX_H / fullH, 1)
  const w = Math.round(fullW * scale)
  const h = Math.round(fullH * scale)

  return (
    <button
      type="button"
      onClick={onClick}
      className="group/preview flex flex-col items-center gap-2"
      title={`Add ${variant.groupName} · ${variant.label}`}
    >
      <div
        className="relative overflow-hidden rounded-[20px] ring-1 ring-white/10 transition group-hover/preview:ring-2 group-hover/preview:ring-white/40"
        style={{ width: w, height: h }}
      >
        <div
          className="pointer-events-none origin-top-left"
          style={{ width: fullW, height: fullH, transform: `scale(${scale})` }}
        >
          <div className="h-full w-full [&>*]:h-full">
            <Suspense fallback={<div className="h-full w-full rounded-3xl bg-white/5" />}>
              <variant.component />
            </Suspense>
          </div>
        </div>
        <div className="absolute inset-0 bg-black/0 transition group-hover/preview:bg-black/10" />
      </div>
      <span className="text-[11px] font-medium text-white/55 transition group-hover/preview:text-white">
        {variant.label}
      </span>
    </button>
  )
}
