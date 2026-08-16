import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { PluginHostContext } from './hooks'
import { createHomepageContext, type PluginFiber } from './runtime'
import { pluginDescriptors, useEnabledPlugins } from './registry'

/**
 * Mounts enabled build-time plugins into the mini-Cordis context.
 *
 * Discovery is `import.meta.glob` (compile time). This component only
 * instantiates fibers for plugins already in the bundle — MV3-safe.
 */
export function PluginHost({ children }: { children: ReactNode }) {
  const [ctx] = useState(() => createHomepageContext())
  const { overrides } = useEnabledPlugins()
  const fibersRef = useRef<Map<string, PluginFiber>>(new Map())

  const enabledIds = useMemo(
    () => pluginDescriptors.filter((plugin) => overrides[plugin.id] !== false).map((plugin) => plugin.id),
    [overrides],
  )

  useEffect(() => {
    const fibers = fibersRef.current

    for (const descriptor of pluginDescriptors) {
      const enabled = enabledIds.includes(descriptor.id)
      if (enabled && !fibers.has(descriptor.id)) {
        try {
          fibers.set(descriptor.id, ctx.plugin(descriptor))
        } catch (error) {
          console.error(`[plugins] failed to mount "${descriptor.id}"`, error)
        }
      } else if (!enabled && fibers.has(descriptor.id)) {
        const fiber = fibers.get(descriptor.id)
        fibers.delete(descriptor.id)
        void fiber?.dispose()
      }
    }
  }, [ctx, enabledIds])

  useEffect(() => {
    const fibers = fibersRef.current
    return () => {
      for (const fiber of fibers.values()) void fiber.dispose()
      fibers.clear()
    }
  }, [])

  return <PluginHostContext.Provider value={ctx}>{children}</PluginHostContext.Provider>
}
