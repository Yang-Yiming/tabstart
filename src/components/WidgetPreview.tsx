import { Suspense } from 'react'
import type { WidgetDescriptor } from '../plugins/types'
import { gridItemSize } from '../lib/grid'

const MAX_W = 240
const MAX_H = 240

interface Props {
  plugin: WidgetDescriptor
  onClick: () => void
  /** Real grid column width measured from the dashboard; falls back to a nominal 4-col layout. */
  colWidth: number
}

export function WidgetPreview({ plugin, onClick, colWidth }: Props) {
  const full = gridItemSize(colWidth, plugin.defaultW, plugin.defaultH)
  const scale = Math.min(MAX_W / full.width, MAX_H / full.height, 1)
  const w = Math.round(full.width * scale)
  const h = Math.round(full.height * scale)

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
          style={{ width: full.width, height: full.height, transform: `scale(${scale})` }}
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
