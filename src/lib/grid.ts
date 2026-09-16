/**
 * Grid geometry shared by the dashboard grid and the add-widget previews,
 * kept in one place so previews mirror the real widget proportions.
 * Mirrors react-grid-layout's calcGridColWidth / calcGridItemWHPx.
 */
export const BREAKPOINTS = { lg: 960, md: 640, sm: 0 } as const
export const COLS = { lg: 4, md: 2, sm: 1 } as const
export const GRID_ROW_HEIGHT = 112
export const GRID_MARGIN = 16

export type BreakpointKey = keyof typeof COLS

export function breakpointForWidth(width: number): BreakpointKey {
  // Strict comparisons mirror react-grid-layout's getBreakpointFromWidth, which
  // picks the highest breakpoint the width strictly exceeds.
  if (width > BREAKPOINTS.lg) return 'lg'
  if (width > BREAKPOINTS.md) return 'md'
  return 'sm'
}

export function colsForWidth(width: number): number {
  return COLS[breakpointForWidth(width)]
}

/** Column width for a given grid container width (react-grid-layout formula). */
export function colWidthForWidth(width: number): number {
  const cols = colsForWidth(width)
  return (width - GRID_MARGIN * (cols - 1)) / cols
}

/** Rendered size in px of a widget spanning w×h grid cells. */
export function gridItemSize(
  colWidth: number,
  w: number,
  h: number,
): { width: number; height: number } {
  return {
    width: w * colWidth + (w - 1) * GRID_MARGIN,
    height: h * GRID_ROW_HEIGHT + (h - 1) * GRID_MARGIN,
  }
}

/** Positioned grid item; the structural subset of react-grid-layout's LayoutItem. */
export interface GridItem {
  i: string
  x: number
  y: number
  w: number
  h: number
}

/** Rectangle intersection, mirroring react-grid-layout's `collides`. */
function collides(a: GridItem, b: GridItem): boolean {
  if (a.i === b.i) return false
  if (a.x + a.w <= b.x) return false
  if (a.x >= b.x + b.w) return false
  if (a.y + a.h <= b.y) return false
  if (a.y >= b.y + b.h) return false
  return true
}

function firstCollision(layout: GridItem[], item: GridItem): GridItem | undefined {
  return layout.find((other) => collides(other, item))
}

/**
 * Push `item` down to `moveToCoord`, dragging anything it lands on down too.
 * Mirrors react-grid-layout's `resolveCompactionCollision` for the vertical
 * axis, including the detail that the entry is nudged down one row before the
 * scan so the `y > item.y + item.h` cutoff sees the post-nudge position.
 */
function resolveCompactionCollision(
  sorted: Array<{ item: GridItem; index: number }>,
  item: GridItem,
  moveToCoord: number,
): void {
  item.y += 1
  const start = sorted.findIndex((entry) => entry.item.i === item.i)
  for (let i = start + 1; i < sorted.length; i++) {
    const other = sorted[i].item
    if (other.y > item.y + item.h) break
    if (collides(item, other)) {
      resolveCompactionCollision(sorted, other, moveToCoord + item.h)
    }
  }
  item.y = moveToCoord
}

/**
 * react-grid-layout's `compact(layout, 'vertical', cols)`, reproduced so the
 * read-only grid can lay out identically without the library.
 *
 * The algorithm is deliberately *local*, and that is the part worth spelling
 * out: an item is raised only while its current position stays clear, and the
 * first blocked step stops it. When that leaves it overlapping, it is pushed
 * down past the blocker — and whatever it lands on is pushed down in turn.
 * So an item does not jump into a free slot that is above another item's
 * column; it only ever moves along the path it started on. A "place each item
 * at the lowest free row" rewrite looks equivalent but is not: it fills holes
 * this one leaves, which moves widgets relative to the current build.
 *
 * Items are visited in row-major order and pushed down through the same array
 * they are read from (that mutation is load-bearing — a pushed item is later
 * processed from its new position), while the output keeps the input order,
 * because RGL renders in layout order and DOM order decides paint order.
 *
 * Assumes no `static` items: this app never sets one, and statics take a
 * separate path through RGL's compaction. Bounds are assumed already corrected
 * by the caller, which is what `normalizeBreakpoint` does.
 */
export function compactLayout<T extends GridItem>(layout: T[]): T[] {
  const sorted = layout
    .map((item, index) => ({ item: { ...item }, index }))
    .sort((a, b) => a.item.y - b.item.y || a.item.x - b.item.x)
  const placed: T[] = []
  const result = new Array<T>(layout.length)
  let bottom = 0

  for (const entry of sorted) {
    const item = entry.item
    item.y = Math.min(bottom, item.y)

    while (item.y > 0 && !firstCollision(placed, item)) item.y -= 1

    let hit = firstCollision(placed, item)
    while (hit) {
      resolveCompactionCollision(sorted, item, hit.y + hit.h)
      hit = firstCollision(placed, item)
    }

    item.y = Math.max(item.y, 0)
    item.x = Math.max(item.x, 0)
    bottom = Math.max(bottom, item.y + item.h)
    placed.push(item)
    result[entry.index] = item
  }

  return result
}

/**
 * Rendered geometry of an item, mirroring react-grid-layout's
 * `calcGridItemPosition` + `calcGridItemWHPx` for `containerPadding: [0, 0]`.
 */
export function itemRect(
  item: GridItem,
  containerWidth: number,
): { left: number; top: number; width: number; height: number } {
  const colWidth = colWidthForWidth(containerWidth)
  return {
    left: Math.round((colWidth + GRID_MARGIN) * item.x),
    top: Math.round((GRID_ROW_HEIGHT + GRID_MARGIN) * item.y),
    width: Math.round(item.w * colWidth + Math.max(0, item.w - 1) * GRID_MARGIN),
    height: Math.round(item.h * GRID_ROW_HEIGHT + Math.max(0, item.h - 1) * GRID_MARGIN),
  }
}

/** Container height for a layout, mirroring react-grid-layout's `containerHeight`. */
export function layoutContainerHeight(layout: GridItem[]): number {
  const rows = layout.reduce((max, item) => Math.max(max, item.y + item.h), 0)
  if (rows === 0) return 0
  return rows * GRID_ROW_HEIGHT + (rows - 1) * GRID_MARGIN
}
