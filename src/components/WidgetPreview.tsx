import { Suspense } from 'react'
import type { WidgetDescriptor } from '../plugins/types'

const CELL = 128
const GAP = 16
const MAX_W = 240
const MAX_H = 240

interface Props {
  plugin: WidgetDescriptor
  onClick: () => void
}

export function WidgetPreview({ plugin, onClick }: Props) {
  const fullW = plugin.defaultW * CELL + (plugin.defaultW - 1) * GAP
  const fullH = plugin.defaultH * CELL + (plugin.defaultH - 1) * GAP
  const scale = Math.min(MAX_W / fullW, MAX_H / fullH, 1)
  const w = Math.round(fullW * scale)
  const h = Math.round(fullH * scale)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onClick()
        }
      }}
      className="group/preview flex flex-col items-center gap-2"
      title={`Add ${plugin.group ?? 'Plugin'} · ${plugin.name}`}
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
              <plugin.component widgetKey={plugin.id} preview />
            </Suspense>
          </div>
        </div>
        <div className="absolute inset-0 bg-black/0 transition group-hover/preview:bg-black/10" />
      </div>
      <span className="text-[11px] font-medium text-white/55 transition group-hover/preview:text-white">
        {plugin.name}
      </span>
    </div>
  )
}
