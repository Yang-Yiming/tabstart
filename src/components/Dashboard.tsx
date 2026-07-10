import { Suspense, useCallback, useMemo, useState } from 'react'
import { GripVertical, Plus, RotateCcw, X } from 'lucide-react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import type { Layout, Layouts } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { canonicalKey, resolveVariant, variantKey, widgetGroups } from '../widgets/registry'
import { WidgetPreview } from './WidgetPreview'

interface Props {
  isEditing: boolean
}

const ResponsiveGridLayout = WidthProvider(Responsive)
const BREAKPOINTS = { lg: 960, md: 640, sm: 0 }
const COLS = { lg: 4, md: 2, sm: 1 }
const LAYOUT_KEY = 'homepage-widget-layouts-v1'
const GRID_ROW_HEIGHT = 112

const DEFAULT_LAYOUTS: Layouts = {
  lg: [
    { i: 'bookmarks', x: 0, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
    { i: 'notes', x: 2, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
    { i: 'heatmap', x: 0, y: 2, w: 4, h: 2, minW: 3, minH: 2 },
    { i: 'streak', x: 0, y: 4, w: 1, h: 1, minW: 1, minH: 1 },
  ],
  md: [
    { i: 'bookmarks', x: 0, y: 0, w: 1, h: 2, minW: 1, minH: 2 },
    { i: 'notes', x: 1, y: 0, w: 1, h: 2, minW: 1, minH: 2 },
    { i: 'heatmap', x: 0, y: 2, w: 2, h: 2, minW: 2, minH: 2 },
    { i: 'streak', x: 0, y: 4, w: 1, h: 1, minW: 1, minH: 1 },
  ],
  sm: [
    { i: 'bookmarks', x: 0, y: 0, w: 1, h: 2, minW: 1, minH: 2 },
    { i: 'notes', x: 0, y: 2, w: 1, h: 2, minW: 1, minH: 2 },
    { i: 'heatmap', x: 0, y: 4, w: 1, h: 2, minW: 1, minH: 2 },
    { i: 'streak', x: 0, y: 6, w: 1, h: 1, minW: 1, minH: 1 },
  ],
}

function cloneLayouts(layouts: Layouts): Layouts {
  return Object.fromEntries(
    Object.entries(layouts).map(([key, items]) => [key, items.map((item) => ({ ...item }))]),
  )
}

function withWidgetLimits(item: Layout, breakpoint: keyof typeof COLS): Layout {
  const variant = resolveVariant(item.i)
  const cols = COLS[breakpoint]
  const minW = Math.min(variant?.minW ?? 1, cols)
  const w = Math.min(Math.max(item.w, minW), cols)

  return {
    ...item,
    i: canonicalKey(item.i),
    x: Math.min(item.x, Math.max(0, cols - w)),
    w,
    minW,
    minH: variant?.minH ?? item.minH ?? 1,
  }
}

function normalizeLayouts(layouts: Layouts): Layouts {
  return (Object.keys(COLS) as Array<keyof typeof COLS>).reduce<Layouts>((result, breakpoint) => {
    const source = layouts[breakpoint] ?? DEFAULT_LAYOUTS[breakpoint] ?? []
    result[breakpoint] = source
      .filter((item) => resolveVariant(item.i))
      .map((item) => withWidgetLimits(item, breakpoint))
    return result
  }, {})
}

function nextY(layout: Layout[]) {
  return layout.reduce((max, item) => Math.max(max, item.y + item.h), 0)
}

function createLayoutItem(key: string, breakpoint: keyof typeof COLS, layout: Layout[]): Layout {
  const variant = resolveVariant(key)!
  const cols = COLS[breakpoint]
  const w = Math.min(variant.defaultW, cols)
  return {
    i: key,
    x: 0,
    y: nextY(layout),
    w,
    h: variant.defaultH,
    minW: Math.min(variant.minW, cols),
    minH: variant.minH,
  }
}

export function Dashboard({ isEditing }: Props) {
  const [layouts, setLayouts] = useLocalStorage<Layouts>(LAYOUT_KEY, DEFAULT_LAYOUTS, {
    debounceMs: 350,
  })
  const [addPanelOpen, setAddPanelOpen] = useState(false)

  const normalizedLayouts = useMemo(() => normalizeLayouts(layouts), [layouts])
  const activeKeys = useMemo(
    () => new Set((normalizedLayouts.lg ?? []).map((item) => item.i)),
    [normalizedLayouts],
  )

  const handleLayoutChange = useCallback(
    (_currentLayout: Layout[], allLayouts: Layouts) => {
      setLayouts(normalizeLayouts(allLayouts))
    },
    [setLayouts],
  )

  const handleRemove = useCallback(
    (key: string) => {
      setLayouts((prev) => {
        const next = cloneLayouts(normalizeLayouts(prev))
        for (const bp of Object.keys(COLS)) {
          next[bp] = (next[bp] ?? []).filter((item) => item.i !== key)
        }
        return next
      })
    },
    [setLayouts],
  )

  const handleAdd = useCallback(
    (key: string) => {
      setLayouts((prev) => {
        const next = cloneLayouts(normalizeLayouts(prev))
        for (const bp of Object.keys(COLS) as Array<keyof typeof COLS>) {
          const layout = next[bp] ?? []
          if (!layout.some((item) => item.i === key)) {
            next[bp] = [...layout, createLayoutItem(key, bp, layout)]
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

  const availableGroups = useMemo(
    () =>
      widgetGroups.filter((group) =>
        group.variants.some((v) => !activeKeys.has(variantKey(group.id, v.id))),
      ),
    [activeKeys],
  )

  const renderedWidgets = useMemo(() => {
    return (normalizedLayouts.lg ?? []).map((item) => {
      const variant = resolveVariant(item.i)
      if (!variant) return null
      const WidgetComponent = variant.component

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
                  handleRemove(item.i)
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
    <div className={['dashboard-grid relative', isEditing ? 'is-editing' : ''].join(' ')}>
      <ResponsiveGridLayout
        layouts={normalizedLayouts}
        breakpoints={BREAKPOINTS}
        cols={COLS}
        rowHeight={GRID_ROW_HEIGHT}
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
        <div className="mt-5 flex flex-col items-center gap-3">
          {addPanelOpen ? (
            <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-black/35 p-5 shadow-2xl backdrop-blur-2xl">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-white/85">Add a Widget</span>
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

              {availableGroups.length === 0 ? (
                <p className="py-6 text-center text-sm text-white/45">All widgets are on the page.</p>
              ) : (
                <div className="flex max-h-[60vh] flex-col gap-6 overflow-y-auto pr-1">
                  {availableGroups.map((group) => {
                    const openVariants = group.variants.filter(
                      (v) => !activeKeys.has(variantKey(group.id, v.id)),
                    )
                    if (openVariants.length === 0) return null
                    return (
                      <div key={group.id} className="flex flex-col gap-3">
                        <span className="text-xs font-medium uppercase tracking-[0.16em] text-white/40">
                          {group.name}
                        </span>
                        <div className="flex flex-wrap items-end gap-5">
                          {openVariants.map((v) => {
                            const key = variantKey(group.id, v.id)
                            const resolved = resolveVariant(key)!
                            return (
                              <WidgetPreview key={key} variant={resolved} onClick={() => handleAdd(key)} />
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
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
