/* ------------------------------------------------------------------ */
/* Peak windows (local-time pricing alerts) — shared by plugins         */
/* ------------------------------------------------------------------ */

export interface PeakWindow {
  /** Local time "HH:MM". */
  from: string
  /** Local time "HH:MM". */
  to: string
}

function toMinutes(hhmm: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim())
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour > 23 || minute > 59) return null
  return hour * 60 + minute
}

/** Parse a JSON array of `{from, to}` windows; invalid entries are dropped. */
export function parsePeakWindows(source: string): PeakWindow[] {
  const raw = source.trim()
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (entry): entry is PeakWindow =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as PeakWindow).from === 'string' &&
        typeof (entry as PeakWindow).to === 'string',
    )
  } catch {
    return []
  }
}

/** True when the given local time falls inside any window (windows may cross midnight). */
export function isInPeakWindows(windows: PeakWindow[], date = new Date()): boolean {
  if (windows.length === 0) return false
  const minutes = date.getHours() * 60 + date.getMinutes()
  return windows.some((window) => {
    const from = toMinutes(window.from)
    const to = toMinutes(window.to)
    if (from == null || to == null) return false
    return from <= to ? minutes >= from && minutes < to : minutes >= from || minutes < to
  })
}
