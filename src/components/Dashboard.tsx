import { Suspense, useCallback, useMemo, useState } from 'react'
import { GripVertical, Plus, RotateCcw, X } from 'lucide-react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import type { Layout, Layouts } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { widgetMetaById, widgetMetaList, widgetRegistry } from '../widgets/registry'
import type { WidgetId } from '../widgets/types'

interface Props {
  isEditing: boolean
}

const ResponsiveGridLayout = WidthProvider(Responsive)
const BREAKPOINTS = { lg: 960, md: 640, sm: 0 }
const COLS = { lg: 4, md: 2, sm: 1 }
const LAYOUT_KEY = 'homepage-widget-layouts-v1'

const DEFAULT_LAYOUTS: Layouts = {
  lg: [
    { i: 'bookmarks', x: 0, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
    { i: 'notes', x: 2, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
    { i: 'heatmap', x: 0, y: 2, w: 4, h: 2, minW: 3, minH: 2 },
  ],
  md: [
    { i: 'bookmarks', x: 0, y: 0, w: 1, h: 2, minW: 1, minH: 2 },
    { i: 'notes', x: 1, y: 0, w: 1, h: 2, minW: 1, minH: 2 },
    { i: 'heatmap', x: 0, y: 2, w: 2, h: 2, minW: 2, minH: 2 },
  ],
  sm: [
    { i: 'bookmarks', x: 0, y: 0, w: 1, h: 2, minW: 1, minH: 2 },
    { i: 'notes', x: 0, y: 2, w: 1, h: 2, minW: 1, minH: 2 },
    { i: 'heatmap', x: 0, y: 4, w: 1, h: 2, minW: 1, minH: 2 },
  ],
}

function cloneLayouts(layouts: Layouts): Layouts {
  return Object.fromEntries(
    Object.entries(layouts).map(([key, items]) => [key, items.map((item) => ({ ...item }))]),
  )
}

function withWidgetLimits(item: Layout, breakpoint: keyof typeof COLS): Layout {
  const meta = widgetMetaById[item.i as WidgetId]
  const cols = COLS[breakpoint]
  const minW = Math.min(meta?.minW ?? 1, cols)
  const w = Math.min(Math.max(item.w, minW), cols)

  return {
    ...item,
    x: Math.min(item.x, Math.max(0, cols - w)),
    w,
    minW,
    minH: meta?.minH ?? item.minH ?? 1,
  }
}

function normalizeLayouts(layouts: Layouts): Layouts {
  return (Object.keys(COLS) as Array<keyof typeof COLS>).reduce<Layouts>((result, breakpoint) => {
    const source = layouts[breakpoint] ?? DEFAULT_LAYOUTS[breakpoint] ?? []
    result[breakpoint] = source
      .filter((item) => item.i in widgetRegistry)
      .map((item) => withWidgetLimits(item, breakpoint))
    return result
  }, {})
}

function nextY(layout: Layout[]) {
  return layout.reduce((max, item) => Math.max(max, item.y + item.h), 0)
}

function createLayoutItem(id: WidgetId, breakpoint: keyof typeof COLS, layout: Layout[]): Layout {
  const meta = widgetMetaById[id]
  const cols = COLS[breakpoint]
  const w = Math.min(meta.defaultW, cols)
  return {
    i: id,
    x: 0,
    y: nextY(layout),
    w,
    h: meta.defaultH,
    minW: Math.min(meta.minW ?? 1, cols),
    minH: meta.minH,
  }
}

export function Dashboard({ isEditing }: Props) {
  const [layouts, setLayouts] = useLocalStorage<Layouts>(LAYOUT_KEY, DEFAULT_LAYOUTS, {
    debounceMs: 350,
  })
  const [addPanelOpen, setAddPanelOpen] = useState(false)

  const normalizedLayouts = useMemo(() => normalizeLayouts(layouts), [layouts])
  const activeIds = useMemo(() => new Set((normalizedLayouts.lg ?? []).map((item) => item.i)), [normalizedLayouts])

  const handleLayoutChange = useCallback(
    (_currentLayout: Layout[], allLayouts: Layouts) => {
      setLayouts(normalizeLayouts(allLayouts))
    },
    [setLayouts],
  )

  const handleRemove = useCallback(
    (id: WidgetId) => {
      setLayouts((prev) => {
        const next = cloneLayouts(normalizeLayouts(prev))
        for (const key of Object.keys(COLS)) {
          next[key] = (next[key] ?? []).filter((item) => item.i !== id)
        }
        return next
      })
    },
    [setLayouts],
  )

  const handleAdd = useCallback(
    (id: WidgetId) => {
      setLayouts((prev) => {
        const next = cloneLayouts(normalizeLayouts(prev))
        for (const breakpoint of Object.keys(COLS) as Array<keyof typeof COLS>) {
          const layout = next[breakpoint] ?? []
          if (!layout.some((item) => item.i === id)) {
            next[breakpoint] = [...layout, createLayoutItem(id, breakpoint, layout)]
          }
        }
        return next
      })
      setAddPanelOpen(false)
    },
    [setLayouts],
  )

  const handleReset = useCallback(() => {
    setLayouts(cloneLayouts(DEFAULT_LAYOUTS))
    setAddPanelOpen(false)
  }, [setLayouts])

  const availableWidgets = useMemo(
    () => widgetMetaList.filter((meta) => !activeIds.has(meta.id)),
    [activeIds],
  )

  const renderedWidgets = useMemo(() => {
    return (normalizedLayouts.lg ?? []).map((item) => {
      const WidgetComponent = widgetRegistry[item.i as WidgetId]
      if (!WidgetComponent) return null

      return (
        <div key={item.i} className="group/widget relative h-full">
          <div className="h-full [&>*]:h-full">
            <Suspense fallback={<div className="h-full rounded-2xl bg-black/20 backdrop-blur-xl" />}>
              <WidgetComponent />
            </Suspense>
          </div>

          {isEditing && (
            <>
              <div
                className="drag-handle absolute left-2 top-2 z-20 cursor-grab rounded-full border border-white/10 bg-black/25 p-1.5 text-white/65 shadow-lg backdrop-blur-xl transition hover:bg-white/15 hover:text-white active:cursor-grabbing"
                aria-label="Move widget"
                title="Move widget"
                role="button"
                tabIndex={0}
              >
                <GripVertical className="h-4 w-4" />
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemove(item.i as WidgetId)
                }}
                className="absolute right-2 top-2 z-20 rounded-full border border-white/10 bg-black/25 p-1.5 text-white/65 shadow-lg backdrop-blur-xl transition hover:bg-red-500/20 hover:text-red-100"
                aria-label="Remove widget"
                title="Remove widget"
              >
                <X className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      )
    })
  }, [handleRemove, isEditing, normalizedLayouts])

  return (
    <div className="dashboard-grid relative">
      <ResponsiveGridLayout
        layouts={normalizedLayouts}
        breakpoints={BREAKPOINTS}
        cols={COLS}
        rowHeight={120}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        isDraggable={isEditing}
        isResizable={isEditing}
        draggableHandle=".drag-handle"
        draggableCancel="input,textarea,button,select,a"
        onLayoutChange={handleLayoutChange}
        compactType="vertical"
        useCSSTransforms
      >
        {renderedWidgets}
      </ResponsiveGridLayout>

      {isEditing && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {addPanelOpen ? (
            <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-black/35 p-3 shadow-2xl backdrop-blur-2xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {availableWidgets.length === 0 ? (
                    <span className="px-2 py-1.5 text-sm text-white/45">All widgets are on the page.</span>
                  ) : (
                    availableWidgets.map((meta) => (
                      <button
                        key={meta.id}
                        type="button"
                        onClick={() => handleAdd(meta.id)}
                        className="rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/80 transition hover:bg-white/18 hover:text-white"
                      >
                        {meta.name}
                      </button>
                    ))
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setAddPanelOpen(false)}
                  className="shrink-0 rounded-full p-1.5 text-white/55 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close widget picker"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddPanelOpen(true)}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-4 py-2 text-sm text-white/70 shadow-lg backdrop-blur-xl transition hover:bg-white/10 hover:text-white"
            >
              <Plus className="h-4 w-4" />
              Add Widget
            </button>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/55 shadow-lg backdrop-blur-xl transition hover:bg-white/10 hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
      )}
    </div>
  )
}
