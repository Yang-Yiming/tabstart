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
  if (width >= BREAKPOINTS.lg) return 'lg'
  if (width >= BREAKPOINTS.md) return 'md'
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
