import { useCallback, useEffect, useRef, useState } from 'react'
import { storageArea } from '../lib/storage'

type SetStoredValue<T> = (value: T | ((prev: T) => T)) => void

interface StorageOptions {
  debounceMs?: number
}

const STORED_STATE_EVENT = 'tabstart:stored-state-change'

interface StoredStateEventDetail<T> {
  key: string
  value: T
}

export function useStoredState<T>(
  key: string,
  initialValue: T,
  options: StorageOptions = {},
): [T, SetStoredValue<T>, boolean] {
  const [stored, setStored] = useState<T>(initialValue)
  const [hydrated, setHydrated] = useState(false)
  const changedBeforeHydrateRef = useRef(false)
  const writeTimerRef = useRef<number | null>(null)
  const latestRef = useRef(initialValue)
  const hasPendingWriteRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    try {
      storageArea.get<T>(key).then((value) => {
        if (cancelled) return
        if (value !== undefined && !changedBeforeHydrateRef.current) {
          latestRef.current = value
          setStored(value)
        }
        setHydrated(true)
      }).catch(() => {
        if (!cancelled) setHydrated(true)
      })
    } catch {
      setHydrated(true)
    }
    return () => {
      cancelled = true
    }
  }, [key])

  useEffect(() => {
    return () => {
      if (writeTimerRef.current) {
        window.clearTimeout(writeTimerRef.current)
        writeTimerRef.current = null
      }
      if (hasPendingWriteRef.current) {
        storageArea.set(key, latestRef.current).catch(() => {})
        hasPendingWriteRef.current = false
      }
    }
  }, [key])

  useEffect(() => {
    const syncFromPeer = (event: Event) => {
      const { key: changedKey, value } = (event as CustomEvent<StoredStateEventDetail<T>>).detail
      if (changedKey !== key || value === latestRef.current) return
      latestRef.current = value
      setStored(value)
    }
    window.addEventListener(STORED_STATE_EVENT, syncFromPeer)
    return () => window.removeEventListener(STORED_STATE_EVENT, syncFromPeer)
  }, [key])

  const persist = useCallback(
    (value: T) => {
      if (writeTimerRef.current) {
        window.clearTimeout(writeTimerRef.current)
      }

      const write = () => {
        writeTimerRef.current = null
        hasPendingWriteRef.current = false
        storageArea.set(key, value).catch(() => {})
      }

      if (options.debounceMs && options.debounceMs > 0) {
        hasPendingWriteRef.current = true
        writeTimerRef.current = window.setTimeout(write, options.debounceMs)
        return
      }

      write()
    },
    [key, options.debounceMs],
  )

  const setValue = useCallback<SetStoredValue<T>>(
    (value) => {
      changedBeforeHydrateRef.current = !hydrated
      setStored((prev) => {
        const next = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value
        latestRef.current = next
        persist(next)
        window.queueMicrotask(() => {
          window.dispatchEvent(
            new CustomEvent<StoredStateEventDetail<T>>(STORED_STATE_EVENT, { detail: { key, value: next } }),
          )
        })
        return next
      })
    },
    [hydrated, key, persist],
  )

  return [stored, setValue, hydrated]
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: StorageOptions,
): [T, SetStoredValue<T>] {
  const [stored, setStored] = useStoredState(key, initialValue, options)
  return [stored, setStored]
}
