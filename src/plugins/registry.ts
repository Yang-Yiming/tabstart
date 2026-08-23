import config from './plugin.config.json'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { storageArea } from '../lib/storage'
import type { HomepagePlugin } from './runtime'
import type { WidgetDescriptor } from './types'

/* ------------------------------------------------------------------ */
/* Discovery                                                            */
/* ------------------------------------------------------------------ */

interface PluginModule {
  plugins: HomepagePlugin[]
}

/**
 * Vite expands these globs statically at build time (MV3-safe, no remote
 * code), so the bundled plugin set is simply "whatever exists on disk": a
 * fresh clone without user plugins builds out of the box. Adding or removing
 * a plugin folder takes effect on the next dev-server start / build.
 */
const builtinModules = import.meta.glob<PluginModule>('./*/plugin.tsx', { eager: true })
const userModules = import.meta.glob<PluginModule>('/user-plugins/**/plugin.tsx', { eager: true })

/** Glob key → plugin dir: `./core/plugin.tsx` → `core`,
 *  `/user-plugins/my-tabstart-plugins/deepseek/plugin.tsx` → `my-tabstart-plugins/deepseek`. */
function dirOf(key: string): string {
  const parts = key.split('/')
  return parts.slice(parts[0] === '' ? 2 : 1, -1).join('/')
}

/** Built-in enable list (`plugin.config.json`); the core shell is mandatory. */
const enabledBuiltins = new Set<string>(['core', ...(config.plugins ?? [])])

interface EnabledPluginModule {
  dir: string
  plugins: HomepagePlugin[]
}

const enabledPluginModules: EnabledPluginModule[] = [
  ...Object.entries(builtinModules)
    .filter(([key]) => enabledBuiltins.has(dirOf(key)))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, module]) => ({ dir: dirOf(key), plugins: module.plugins })),
  ...Object.entries(userModules)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, module]) => ({ dir: dirOf(key), plugins: module.plugins })),
]

/** All build-time plugin descriptors, in display order. */
export const pluginDescriptors: HomepagePlugin[] = (() => {
  const seen = new Set<string>()
  const out: HomepagePlugin[] = []
  for (const module of enabledPluginModules) {
    for (const plugin of module.plugins) {
      if (seen.has(plugin.id)) {
        console.warn(`[plugins] duplicate plugin id "${plugin.id}" in ${module.dir}; keeping first`)
        continue
      }
      seen.add(plugin.id)
      out.push(plugin)
    }
  }
  return out.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
})()

export const pluginById: Record<string, HomepagePlugin> = Object.fromEntries(
  pluginDescriptors.map((plugin) => [plugin.id, plugin]),
)

/** All widget manifests contributed by build-time plugins (enabled or not). */
export const allWidgets: WidgetDescriptor[] = pluginDescriptors
  .flatMap((plugin) => plugin.widgets ?? [])
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

export const widgetById: Record<string, WidgetDescriptor> = Object.fromEntries(
  allWidgets.map((widget) => [widget.id, widget]),
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

export function resolveWidget(key: string): WidgetDescriptor | undefined {
  return widgetById[canonicalKey(key)]
}

/** Legacy stored keys that migrate into the given plugin id. */
export function legacyKeysFor(id: string): string[] {
  return Object.entries(MIGRATION_MAP)
    .filter(([, target]) => target === id)
    .map(([key]) => key)
}

/** Group widgets by their `group` label for the picker / settings sidebar. */
export interface WidgetGroup {
  name: string
  plugins: WidgetDescriptor[]
}

export function groupWidgets(list: WidgetDescriptor[]): WidgetGroup[] {
  const map = new Map<string, WidgetDescriptor[]>()
  for (const widget of list) {
    const name = widget.group ?? 'Plugins'
    const arr = map.get(name) ?? []
    arr.push(widget)
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

