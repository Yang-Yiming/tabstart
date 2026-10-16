import { useCallback, useRef, useState, type ComponentType } from 'react'

/**
 * Resolves a lazily-imported component outside React.lazy's suspend-and-retry
 * cycle: an already-resolved module is stored in state, so the first open
 * commits synchronously instead of throwing the promise and waiting for a
 * scheduler retry (which showed up as a noticeable stall).
 *
 * The chunk is warmed on trigger hover/focus, so by the time the user interacts
 * the component is ready with zero loading state. `component` stays null while
 * the chunk is still in flight; callers decide what to show in the meantime.
 */
export function useLazyComponent(load: () => Promise<{ default: ComponentType<any> }>) {
  const [component, setComponent] = useState<ComponentType<any> | null>(null)
  const requestedRef = useRef(false)

  const request = useCallback(() => {
    if (requestedRef.current) return
    requestedRef.current = true
    load()
      .then((m) => setComponent(() => m.default))
      .catch(() => {
        requestedRef.current = false
      })
  }, [load])

  return { component, request }
}
