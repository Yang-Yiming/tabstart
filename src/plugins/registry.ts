import { useLocalStorage } from '../hooks/useLocalStorage'
import { storageArea } from '../lib/storage'
import type { WidgetPlugin } from './types'

/* ------------------------------------------------------------------ */
/* Discovery: every folder under src/plugins with a plugin.tsx becomes  */
/* a plugin. Add a plugin = add a folder + rebuild.                    */
/* ------------------------------------------------------------------ */

const modules = import.meta.glob<{ default?: WidgetPlugin | WidgetPlugin[] }>('./*/plugin.tsx', {
  eager: true,
})

/** All registered plugins, in display order. A folder may export one or several plugins. */
export const plugins: WidgetPlugin[] = Object.values(modules)
  .flatMap((module) => (Array.isArray(module.default) ? module.default : module.default ? [module.default] : []))
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

export const pluginById: Record<string, WidgetPlugin> = Object.fromEntries(
  plugins.map((plugin) => [plugin.id, plugin]),
)

/* ------------------------------------------------------------------ */
/* Legacy key migration                                                */
/* ------------------------------------------------------------------ */

/**
 * Old (pre-plugin) widget keys → new plugin ids. Keys without a mapping
 * (e.g. `gauge:custom`) are dropped from layouts and settings.
 */
const MIGRATION_MAP: Record<string, string> = {
  bookmarks: 'bookmarks',
  notes: 'notes',
  heatmap: 'heatmap',
  streak: 'streak',
  todo: 'todo',
  pomodoro: 'pomodoro-compact',
  'pomodoro:compact': 'pomodoro-compact',
  'pomodoro:large': 'pomodoro-large',
  'kanban:full': 'kanban-full',
  'kanban:compact': 'kanban-compact',
  'gauge:deepseek-balance': 'deepseek',
}

/** Resolve a (possibly legacy) key to a known plugin id, falling back to the input. */
export function canonicalKey(key: string): string {
  if (pluginById[key]) return key
  const mapped = MIGRATION_MAP[key]
  return mapped && pluginById[mapped] ? mapped : key
}

export function resolvePlugin(key: string): WidgetPlugin | undefined {
  return pluginById[canonicalKey(key)]
}

/** Legacy stored keys that migrate into the given plugin id. */
export function legacyKeysFor(id: string): string[] {
  return Object.entries(MIGRATION_MAP)
    .filter(([, target]) => target === id)
    .map(([key]) => key)
}

/** Group a plugin list by their `group` label for the picker / settings sidebar. */
export interface PluginGroup {
  name: string
  plugins: WidgetPlugin[]
}

export function groupPlugins(list: WidgetPlugin[]): PluginGroup[] {
  const map = new Map<string, WidgetPlugin[]>()
  for (const plugin of list) {
    const name = plugin.group ?? 'Plugins'
    const arr = map.get(name) ?? []
    arr.push(plugin)
    map.set(name, arr)
  }
  return [...map.entries()].map(([name, plugins]) => ({ name, plugins }))
}

/* ------------------------------------------------------------------ */
/* Enabled / disabled state                                            */
/* ------------------------------------------------------------------ */

const ENABLED_KEY = 'homepage-plugin-enabled-v1'

/** Per-plugin enable toggle. Only `false` entries are stored (default: enabled). */
export function useEnabledPlugins() {
  const [overrides, setOverrides] = useLocalStorage<Record<string, boolean>>(ENABLED_KEY, {})
  const isEnabled = (id: string) => overrides[id] !== false
  const setEnabled = (id: string, enabled: boolean) => {
    setOverrides((prev) => {
      const next = { ...prev }
      if (enabled) delete next[id]
      else next[id] = false
      return next
    })
  }
  return { overrides, isEnabled, setEnabled }
}

/* ------------------------------------------------------------------ */
/* One-time rewrite of stored layouts & settings keys                  */
/* ------------------------------------------------------------------ */

function migrateLayouts(value: Record<string, unknown>): boolean {
  let changed = false
  for (const bp of Object.keys(value)) {
    const items = value[bp]
    if (!Array.isArray(items)) continue
    const next: unknown[] = []
    for (const item of items) {
      if (typeof item !== 'object' || item === null) continue
      const layout = item as { i?: unknown }
      if (typeof layout.i !== 'string') continue
      const canonical = canonicalKey(layout.i)
      if (!pluginById[canonical]) {
        changed = true
        continue
      }
      if (canonical !== layout.i) {
        changed = true
        next.push({ ...layout, i: canonical })
      } else {
        next.push(layout)
      }
    }
    if (changed) value[bp] = next
  }
  return changed
}

function migrateSettings(value: Record<string, unknown>): boolean {
  let changed = false
  for (const key of Object.keys(value)) {
    const canonical = canonicalKey(key)
    if (!pluginById[canonical]) {
      delete value[key]
      changed = true
    } else if (canonical !== key) {
      value[canonical] = value[key]
      delete value[key]
      changed = true
    }
  }
  return changed
}

/**
 * Rewrite stored layouts & settings from legacy widget keys to plugin ids.
 * Safe to run repeatedly; no-op once migrated. Read paths also fall back to
 * legacy keys, so this is pure hygiene.
 */
export async function migratePluginKeys(): Promise<void> {
  const tasks: Array<[string, (value: Record<string, unknown>) => boolean]> = [
    ['homepage-widget-layouts-v1', migrateLayouts],
    ['homepage-widget-settings-v1', migrateSettings],
  ]
  for (const [storageKey, migrate] of tasks) {
    const raw = await storageArea.get<Record<string, unknown>>(storageKey).catch(() => undefined)
    if (raw == null) continue
    if (migrate(raw)) {
      await storageArea.set(storageKey, raw).catch(() => {})
    }
  }
}
