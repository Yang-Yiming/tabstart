import { useState, useEffect } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [stored, setStored] = useState<T>(initialValue)

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key)
      if (item) {
        setStored(JSON.parse(item))
      }
    } catch {}
  }, [key])

  const setValue = (value: T) => {
    try {
      setStored(value)
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {}
  }

  return [stored, setValue]
}
