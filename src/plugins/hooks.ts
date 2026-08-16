import { createContext, useContext, useSyncExternalStore } from 'react'
import type { HomepageContext } from './runtime'
import type { SlotDescriptor, ThemeDescriptor, WidgetDescriptor } from './types'

export const PluginHostContext = createContext<HomepageContext | null>(null)

export function usePluginHost(): HomepageContext {
  const ctx = useContext(PluginHostContext)
  if (!ctx) throw new Error('usePluginHost must be used inside <PluginHost>')
  return ctx
}

/** All widgets currently registered by mounted (enabled) plugins. */
export function useWidgets(): WidgetDescriptor[] {
  const ctx = usePluginHost()
  useSyncExternalStore(ctx.widgets.subscribe, ctx.widgets.getVersion)
  return ctx.widgets.list()
}

/** All slot items currently registered for `slot` by mounted plugins. */
export function useSlotItems(slot: string): SlotDescriptor[] {
  const ctx = usePluginHost()
  useSyncExternalStore(ctx.slots.subscribe, ctx.slots.getVersion)
  return ctx.slots.list(slot)
}

/** All themes currently registered by mounted plugins. */
export function useThemes(): ThemeDescriptor[] {
  const ctx = usePluginHost()
  useSyncExternalStore(ctx.themes.subscribe, ctx.themes.getVersion)
  return ctx.themes.list()
}
