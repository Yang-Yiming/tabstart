import { useState, useEffect } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [stored, setStored] = useState<T>(initialValue)

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        setStored(JSON.parse(item))
      }
    } catch {}
  }, [key])

  const setValue = (value: T | ((prev: T) => T)) => {
    try {
      setStored((prev) => {
        const next = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value
        window.localStorage.setItem(key, JSON.stringify(next))
        return next
      })
    } catch {}
  }

  return [stored, setValue]
}
