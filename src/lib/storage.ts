export interface StorageArea {
  get<T>(key: string): Promise<T | undefined>
  set<T>(key: string, value: T): Promise<void>
}

type ChromeStorageArea = {
  get(keys: string | string[] | Record<string, unknown> | null): Promise<Record<string, unknown>>
  set(items: Record<string, unknown>): Promise<void>
}

type ChromeLike = {
  storage?: {
    local?: ChromeStorageArea
  }
  runtime?: {
    id?: string
  }
}

declare global {
  interface Window {
    chrome?: ChromeLike
  }
}

const isExtensionRuntime = () => {
  if (typeof window === 'undefined') return false
  return Boolean(window.chrome?.runtime?.id && window.chrome.storage?.local)
}

const localStorageArea: StorageArea = {
  async get<T>(key: string) {
    if (typeof window === 'undefined') return undefined
    const raw = window.localStorage.getItem(key)
    if (!raw) return undefined
    try {
      return JSON.parse(raw) as T
    } catch {
      return raw as T
    }
  },
  async set<T>(key: string, value: T) {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(key, JSON.stringify(value))
  },
}

const extensionStorageArea: StorageArea = {
  async get<T>(key: string) {
    const area = window.chrome?.storage?.local
    if (!area) return undefined
    const result = await area.get(key)
    return result[key] as T | undefined
  },
  async set<T>(key: string, value: T) {
    const area = window.chrome?.storage?.local
    if (!area) return
    await area.set({ [key]: value })
  },
}

export const storageArea: StorageArea = isExtensionRuntime()
  ? extensionStorageArea
  : localStorageArea

export const runtimeTarget = isExtensionRuntime() ? 'extension' : 'web'
