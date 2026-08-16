import { Suspense, useCallback, useMemo, useState } from 'react'
import { GripVertical, Plus, RotateCcw, X } from 'lucide-react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import type { Layout, Layouts } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useWidgets } from '../plugins/hooks'
import { canonicalKey, groupWidgets, resolveWidget, useEnabledPlugins } from '../plugins/registry'
import type { WidgetDescriptor } from '../plugins/types'
import { ThemeSurface } from './ThemeSurface'
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
    { i: 'kanban-compact', x: 1, y: 4, w: 2, h: 2, minW: 2, minH: 2 },
  ],
  md: [
    { i: 'bookmarks', x: 0, y: 0, w: 1, h: 2, minW: 1, minH: 2 },
    { i: 'notes', x: 1, y: 0, w: 1, h: 2, minW: 1, minH: 2 },
    { i: 'heatmap', x: 0, y: 2, w: 2, h: 2, minW: 2, minH: 2 },
    { i: 'streak', x: 0, y: 4, w: 1, h: 1, minW: 1, minH: 1 },
    { i: 'kanban-compact', x: 0, y: 5, w: 2, h: 2, minW: 2, minH: 2 },
  ],
  sm: [
    { i: 'bookmarks', x: 0, y: 0, w: 1, h: 2, minW: 1, minH: 2 },
    { i: 'notes', x: 0, y: 2, w: 1, h: 2, minW: 1, minH: 2 },
    { i: 'heatmap', x: 0, y: 4, w: 1, h: 2, minW: 1, minH: 2 },
    { i: 'streak', x: 0, y: 6, w: 1, h: 1, minW: 1, minH: 1 },
    { i: 'kanban-compact', x: 0, y: 7, w: 1, h: 2, minW: 1, minH: 2 },
  ],
}

function cloneLayouts(layouts: Layouts): Layouts {
  return Object.fromEntries(
    Object.entries(layouts).map(([key, items]) => [key, items.map((item) => ({ ...item }))]),
  )
}

function withWidgetLimits(item: Layout, breakpoint: keyof typeof COLS, plugin?: WidgetDescriptor): Layout {
  const cols = COLS[breakpoint]
  const minW = Math.min(plugin?.minW ?? 1, cols)
  const w = Math.min(Math.max(item.w, minW), cols)

  return {
    ...item,
    i: canonicalKey(item.i),
    x: Math.min(item.x, Math.max(0, cols - w)),
    w,
    minW,
    minH: plugin?.minH ?? item.minH ?? 1,
  }
}

function nextY(layout: Layout[]) {
  return layout.reduce((max, item) => Math.max(max, item.y + item.h), 0)
}

/** Canonicalize + clamp a single breakpoint's items (no default fallback). */
function normalizeBreakpoint(items: Layout[], breakpoint: keyof typeof COLS): Layout[] {
  return items
    .map((item) => {
      const plugin = resolveWidget(item.i)
      return plugin ? withWidgetLimits(item, breakpoint, plugin) : null
    })
    .filter((item): item is Layout => item !== null)
}

function createLayoutItem(key: string, breakpoint: keyof typeof COLS, layout: Layout[]): Layout {
  const plugin = resolveWidget(key)
  const cols = COLS[breakpoint]
  const w = Math.min(plugin?.defaultW ?? 1, cols)
  return {
    i: key,
    x: 0,
    y: nextY(layout),
    w,
    h: plugin?.defaultH ?? 1,
    minW: Math.min(plugin?.minW ?? 1, cols),
    minH: plugin?.minH ?? 1,
  }
}

export function Dashboard({ isEditing }: Props) {
  const [layouts, setLayouts] = useLocalStorage<Layouts>(LAYOUT_KEY, DEFAULT_LAYOUTS, {
    debounceMs: 350,
  })
  const [addPanelOpen, setAddPanelOpen] = useState(false)
  const { isEnabled } = useEnabledPlugins()
  const widgets = useWidgets()

  /**
   * Canonicalize + clamp every stored layout item. Keeps disabled plugins so
   * their positions survive a disable/re-enable cycle.
   */
  const normalizeLayouts = useCallback(
    (input: Layouts | null | undefined) => {
      const breakpoints = Object.keys(COLS) as Array<keyof typeof COLS>
      const sources = breakpoints.map((breakpoint) => {
        const stored = input?.[breakpoint]
        const source = Array.isArray(stored) ? stored : (DEFAULT_LAYOUTS[breakpoint] ?? [])
        return { breakpoint, source }
      })
      // Self-heal a layout object corrupted by the previous empty-children mount:
      // an empty breakpoint next to a non-empty one is never produced by the UI,
      // so fall back to defaults only for the empty breakpoint.
      const hasEmpty = sources.some(({ source }) => source.length === 0)
      const hasNonEmpty = sources.some(({ source }) => source.length > 0)
      return sources.reduce<Layouts>((result, { breakpoint, source }) => {
        const effectiveSource = hasEmpty && hasNonEmpty && source.length === 0
          ? (DEFAULT_LAYOUTS[breakpoint] ?? [])
          : source
        result[breakpoint] = normalizeBreakpoint(effectiveSource, breakpoint)
        return result
      }, {})
    },
    [],
  )

  const normalizedLayouts = useMemo(() => normalizeLayouts(layouts), [layouts, normalizeLayouts])

  /** Layouts actually rendered: disabled plugins hidden, their items preserved. */
  const displayLayouts = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(normalizedLayouts).map(([bp, items]) => [bp, items.filter((item) => isEnabled(item.i))]),
      ) as Layouts,
    [normalizedLayouts, isEnabled],
  )

  const activeKeys = useMemo(
    () => new Set((displayLayouts.lg ?? []).map((item) => item.i)),
    [displayLayouts],
  )

  const handleLayoutChange = useCallback(
    (_currentLayout: Layout[], allLayouts: Layouts) => {
      setLayouts((prev) => {
        const merged: Layouts = {}
        for (const bp of Object.keys(COLS) as Array<keyof typeof COLS>) {
          const incoming = allLayouts[bp] ?? []
          const preserved = normalizeBreakpoint((normalizeLayouts(prev)[bp] ?? []).filter((item) => !isEnabled(item.i)), bp)
          merged[bp] = normalizeBreakpoint([...incoming, ...preserved], bp)
        }
        return merged
      })
    },
    [isEnabled, normalizeLayouts, setLayouts],
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
    [normalizeLayouts, setLayouts],
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
    },
    [normalizeLayouts, setLayouts],
  )

  const handleReset = useCallback(() => {
    setLayouts(cloneLayouts(DEFAULT_LAYOUTS))
    setAddPanelOpen(false)
  }, [setLayouts])

  const availableGroups = useMemo(() => {
    const available = widgets.filter((widget) => isEnabled(widget.id) && !activeKeys.has(widget.id))
    return groupWidgets(available)
  }, [activeKeys, isEnabled, widgets])

  const renderedWidgets = useMemo(() => {
    return (displayLayouts.lg ?? []).map((item) => {
      const plugin = resolveWidget(item.i)
      if (!plugin) return null
      const WidgetComponent = plugin.component

      return (
        <div key={item.i} className="group/widget relative h-full">
          <div className="h-full [&>*]:h-full">
            <Suspense fallback={<div className="h-full rounded-2xl bg-black/20 backdrop-blur-xl" />}>
              <WidgetComponent widgetKey={item.i} compact={item.h === 1} />
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
  }, [displayLayouts, handleRemove, isEditing])

  return (
    <div className={['dashboard-grid relative', isEditing ? 'is-editing' : ''].join(' ')}>
      <ResponsiveGridLayout
        layouts={displayLayouts}
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
            <ThemeSurface
              fallbackClassName="border border-white/10 bg-black/35 backdrop-blur-2xl"
              className="w-full max-w-3xl rounded-3xl p-5 shadow-2xl"
            >
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
                  {availableGroups.map((group) => (
                    <div key={group.name} className="flex flex-col gap-3">
                      <span className="text-xs font-medium uppercase tracking-[0.16em] text-white/40">
                        {group.name}
                      </span>
                      <div className="flex flex-wrap items-end gap-5">
                        {group.plugins.map((plugin) => (
                          <WidgetPreview key={plugin.id} plugin={plugin} onClick={() => handleAdd(plugin.id)} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ThemeSurface>
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
