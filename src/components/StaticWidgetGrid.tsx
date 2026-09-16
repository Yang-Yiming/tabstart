import { Children, cloneElement, isValidElement, useMemo, type ReactElement, type ReactNode } from 'react'
import { compactLayout, itemRect, layoutContainerHeight, type GridItem } from '../lib/grid'

interface StaticWidgetGridProps<T extends GridItem> {
  /** Items to render, in layout order. */
  layout: T[]
  /** Width of the grid container in CSS pixels. */
  containerWidth: number
  /** One element per item, keyed by `item.i`. */
  children: ReactNode
}

/**
 * Renders the dashboard's read-only grid without react-grid-layout.
 *
 * The dashboard is a new tab page, so the grid library — 79 kB of JS plus a
 * `GridItem`/`DraggableCore`/`Resizable` wrapper per widget — sat directly on
 * the path to first paint even though it is only needed while editing. This
 * component applies the same geometry RGL would (see `lib/grid.ts`, which
 * mirrors `calcGridItemPosition` / `compact` / `containerHeight`) and clones
 * each child exactly the way RGL's `GridItem` does: the style and class land on
 * the child itself, so there is no extra wrapper element.
 *
 * Interactivity is unaffected — the children keep their own handlers. Editing
 * still runs on RGL, mounted on demand by `GridEditor`.
 */
export function StaticWidgetGrid<T extends GridItem>({
  layout,
  containerWidth,
  children,
}: StaticWidgetGridProps<T>) {
  const childrenByKey = useMemo(() => {
    const elements = new Map<string, ReactElement<{ className?: string; style?: object }>>()
    Children.forEach(children, (child) => {
      if (isValidElement<{ className?: string; style?: object }>(child) && child.key != null) {
        elements.set(String(child.key), child)
      }
    })
    return elements
  }, [children])

  const items = useMemo(() => compactLayout(layout), [layout])
  const height = useMemo(() => layoutContainerHeight(items), [items])

  return (
    <div className="react-grid-layout" style={{ height }}>
      {items.map((item) => {
        const child = childrenByKey.get(item.i)
        if (!child) return null
        const rect = itemRect(item, containerWidth)
        return cloneElement(child, {
          key: item.i,
          className: ['react-grid-item cssTransforms', child.props.className]
            .filter(Boolean)
            .join(' '),
          style: {
            ...child.props.style,
            position: 'absolute',
            transform: `translate(${rect.left}px,${rect.top}px)`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
          },
        })
      })}
    </div>
  )
}
