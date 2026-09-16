import { Responsive } from 'react-grid-layout'
import type { Layout, Layouts } from 'react-grid-layout'
import type { ReactNode } from 'react'

interface GridEditorProps {
  layouts: Layouts
  width: number
  cols: Record<string, number>
  breakpoints: Record<string, number>
  rowHeight: number
  margin: [number, number]
  isDraggable: boolean
  isResizable: boolean
  draggableHandle: string
  draggableCancel: string
  onLayoutChange: (currentLayout: Layout[], allLayouts: Layouts) => void
  children: ReactNode
}

/**
 * The dashboard grid with drag/resize enabled, split into its own chunk so
 * react-grid-layout stays out of the entry bundle.
 *
 * RGL remains the authority for editing: it owns the drag/resize state machine
 * and the layout it hands back through `onLayoutChange` is what gets persisted.
 * The read-only grid (`StaticWidgetGrid`) only reproduces RGL's positioning.
 *
 * Unlike the previous setup this passes `width` explicitly instead of wrapping
 * RGL in `WidthProvider`, which defaults to 1280 px until its own observer fires
 * — every widget was laid out for 1280 and then snapped once the real width
 * arrived. The dashboard measures the container itself and both grids share it.
 */
export function GridEditor({
  layouts,
  width,
  cols,
  breakpoints,
  rowHeight,
  margin,
  isDraggable,
  isResizable,
  draggableHandle,
  draggableCancel,
  onLayoutChange,
  children,
}: GridEditorProps) {
  return (
    <Responsive
      layouts={layouts}
      width={width}
      cols={cols}
      breakpoints={breakpoints}
      rowHeight={rowHeight}
      margin={margin}
      containerPadding={[0, 0]}
      isDraggable={isDraggable}
      isResizable={isResizable}
      draggableHandle={draggableHandle}
      draggableCancel={draggableCancel}
      onLayoutChange={onLayoutChange}
      compactType="vertical"
      useCSSTransforms
    >
      {children}
    </Responsive>
  )
}
