import type { SlotDescriptor, ThemeDescriptor, WidgetDescriptor } from './types'

/* ------------------------------------------------------------------ */
/* Mini Cordis core                                                    */
/*                                                                     */
/* Deliberately small: Context + effect + fiber + registry services.   */
/* Discovery stays build-time (`import.meta.glob`); this runtime only   */
/* mounts plugins that are already in the bundle. MV3-safe.             */
/* ------------------------------------------------------------------ */

export interface PluginFiber {
  id: string
  dispose(): Promise<void>
}

export interface WidgetRegistry {
  register(widget: WidgetDescriptor): () => void
  list(): WidgetDescriptor[]
  get(id: string): WidgetDescriptor | undefined
  subscribe(listener: () => void): () => void
  getVersion(): number
}

export interface SlotRegistry {
  register(slot: SlotDescriptor): () => void
  list(slot: string): SlotDescriptor[]
  subscribe(listener: () => void): () => void
  getVersion(): number
}

export interface ThemeRegistry {
  register(theme: ThemeDescriptor): () => void
  list(): ThemeDescriptor[]
  get(id: string): ThemeDescriptor | undefined
  subscribe(listener: () => void): () => void
  getVersion(): number
}

export interface HomepageContext {
  /** Run an effect now; dispose it when the owning plugin fiber is disposed. */
  effect(effect: () => void | (() => void)): void
  /** Register an event listener tied to the owning plugin fiber. */
  on(event: string, listener: (payload: unknown) => void): () => void
  /** Emit an event to all listeners. */
  emit(event: string, payload?: unknown): void
  /** Optional service lookup. Built-in services are available directly on ctx. */
  get<T = unknown>(name: string): T | undefined
  /** Provide an ad-hoc service. Returns a disposer. */
  provide<T>(name: string, service: T): () => void
  /** Mount a child plugin in the current context. */
  plugin(plugin: HomepagePlugin, config?: unknown): PluginFiber
  widgets: WidgetRegistry
  slots: SlotRegistry
  themes: ThemeRegistry
}

export interface HomepagePlugin {
  id: string
  name: string
  description?: string
  builtin?: boolean
  order?: number
  /** Optional static widget manifest; used for layout canonicalization and picker metadata. */
  widgets?: WidgetDescriptor[]
  apply(ctx: HomepageContext, config?: unknown): void | (() => void)
}

type Disposer = () => void | Promise<void>

function runDisposer(cleanup: void | (() => void)): Disposer | undefined {
  if (typeof cleanup === 'function') return cleanup as Disposer
  return undefined
}

async function runDisposers(effects: Disposer[]) {
  for (const disposer of [...effects].reverse()) {
    const result = disposer()
    if (result && typeof (result as Promise<void>).then === 'function') await result
  }
  effects.length = 0
}

function createRegistry<T extends { id: string }>() {
  const items = new Map<string, T>()
  const listeners = new Set<() => void>()
  let version = 0

  const bump = () => {
    version += 1
    listeners.forEach((listener) => listener())
  }

  return {
    register(item: T) {
      if (items.has(item.id)) {
        console.warn(`[plugins] duplicate id "${item.id}" ignored`)
        return () => {}
      }
      items.set(item.id, item)
      bump()
      return () => {
        items.delete(item.id)
        bump()
      }
    },
    list: () => Array.from(items.values()),
    get: (id: string) => items.get(id),
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    getVersion: () => version,
  }
}

function createSlotRegistry() {
  const registry = createRegistry<SlotDescriptor>()
  return {
    register: registry.register,
    list: (slot: string) =>
      registry
        .list()
        .filter((item) => item.slot === slot)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    subscribe: registry.subscribe,
    getVersion: registry.getVersion,
  }
}

function createRootContext(): HomepageContext {
  const listeners = new Map<string, Set<(payload: unknown) => void>>()
  const services = new Map<string, unknown>()
  const rootEffects: Disposer[] = []

  const root: HomepageContext = {
    effect(effect) {
      const cleanup = runDisposer(effect())
      if (cleanup) rootEffects.push(cleanup)
    },
    on(event, listener) {
      let bucket = listeners.get(event)
      if (!bucket) {
        bucket = new Set()
        listeners.set(event, bucket)
      }
      const set = bucket
                set.add(listener)
      return () => {
        set.delete(listener)
      }
    },
    emit(event, payload) {
      const set = listeners.get(event)
      if (!set) return
      set.forEach((listener) => {
        try {
          listener(payload)
        } catch (error) {
          console.error(`[plugins] listener for "${event}" failed`, error)
        }
      })
    },
    get<T = unknown>(name: string): T | undefined {
      return services.get(name) as T | undefined
    },
    provide<T>(name: string, service: T) {
      services.set(name, service)
      return () => {
        services.delete(name)
      }
    },
    plugin(plugin, config) {
      return mountPlugin(root, plugin, config)
    },
    widgets: undefined as unknown as WidgetRegistry,
    slots: undefined as unknown as SlotRegistry,
    themes: undefined as unknown as ThemeRegistry,
  }

  return root
}

function createChildContext(parent: HomepageContext, effects: Disposer[]): HomepageContext {
  const child = Object.create(parent) as HomepageContext

  child.effect = (effect) => {
    const cleanup = runDisposer(effect())
    if (cleanup) effects.push(cleanup)
  }
  child.on = (event, listener) => {
    const off = parent.on(event, listener)
    effects.push(off)
    return off
  }
  child.emit = (event, payload) => parent.emit(event, payload)
  
  
  child.plugin = (plugin, config) => mountPlugin(child, plugin, config)

  return child
}

export function mountPlugin(parent: HomepageContext, plugin: HomepagePlugin, config?: unknown): PluginFiber {
  const effects: Disposer[] = []
  const child = createChildContext(parent, effects)

  let cleanup: Disposer | undefined
  try {
    cleanup = runDisposer(plugin.apply(child, config))
  } catch (error) {
    void runDisposers(effects)
    throw error
  }

  if (cleanup) effects.push(cleanup)

  return {
    id: plugin.id,
    dispose() {
      return runDisposers(effects)
    },
  }
}

/** Create the singleton host context with widget/slot/theme registries attached. */
export function createHomepageContext(): HomepageContext {
  const ctx = createRootContext()
  ctx.widgets = createRegistry<WidgetDescriptor>()
  ctx.slots = createSlotRegistry()
  ctx.themes = createRegistry<ThemeDescriptor>()
  return ctx
}

/** Convenience helper for the common case: a plugin that contributes one grid widget. */
export function defineWidgetPlugin(widget: WidgetDescriptor): HomepagePlugin {
  return {
    id: widget.id,
    name: widget.name,
    description: widget.description,
    builtin: widget.builtin,
    order: widget.order,
    widgets: [widget],
    apply(ctx) {
      ctx.effect(() => ctx.widgets.register(widget))
    },
  }
}
