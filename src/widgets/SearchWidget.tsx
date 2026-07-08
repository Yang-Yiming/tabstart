import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ArrowRight, Search, Trash2 } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { homepageConfig } from '../config/homepage'

const HISTORY_KEY = 'homepage-search-history'
const ENGINE_KEY = 'homepage-search-engine'
const MAX_HISTORY = 8

const ENGINE_ORDER = ['google', 'bing', 'duckduckgo', 'github', 'alphaxiv'] as const

type EngineKey = (typeof ENGINE_ORDER)[number]

type HistoryItem = { query: string; engine: EngineKey }

const GithubIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
)

const engineMeta: Record<EngineKey, { name: string; icon: ReactNode; smallIcon: ReactNode; shortcut: string }> = {
  google: {
    name: 'Google',
    icon: <span className="font-semibold">G</span>,
    smallIcon: <span className="font-semibold text-xs">G</span>,
    shortcut: '1',
  },
  bing: {
    name: 'Bing',
    icon: <span className="font-semibold">B</span>,
    smallIcon: <span className="font-semibold text-xs">B</span>,
    shortcut: '2',
  },
  duckduckgo: {
    name: 'DuckDuckGo',
    icon: <span className="font-semibold">D</span>,
    smallIcon: <span className="font-semibold text-xs">D</span>,
    shortcut: '3',
  },
  github: {
    name: 'GitHub',
    icon: <GithubIcon />,
    smallIcon: <GithubIcon className="h-3 w-3" />,
    shortcut: '4',
  },
  alphaxiv: {
    name: 'AlphaXiv',
    icon: <span className="font-serif text-lg">α</span>,
    smallIcon: <span className="font-serif text-sm">α</span>,
    shortcut: '5',
  },
}

const defaultEngine = homepageConfig.search.defaultEngine as EngineKey

const normalizeHistoryItem = (item: unknown): HistoryItem => {
  if (item && typeof item === 'object' && !Array.isArray(item)) {
    const record = item as Record<string, unknown>
    const query = typeof record.query === 'string' ? record.query : String(record.query ?? '')
    const engine = ENGINE_ORDER.includes(record.engine as EngineKey)
      ? (record.engine as EngineKey)
      : defaultEngine
    return { query, engine }
  }
  if (typeof item === 'string') {
    return { query: item, engine: defaultEngine }
  }
  return { query: String(item ?? ''), engine: defaultEngine }
}

export function SearchWidget() {
  const [query, setQuery] = useState('')
  const [rawHistory, setHistory] = useLocalStorage<unknown[]>(HISTORY_KEY, [])
  const history = useMemo(
    () =>
      Array.isArray(rawHistory)
        ? rawHistory.map(normalizeHistoryItem).filter((item) => item.query.trim() !== '')
        : [],
    [rawHistory],
  )
  const [storedEngine, setEngineKey] = useLocalStorage<string>(
    ENGINE_KEY,
    homepageConfig.search.defaultEngine
  )
  const engineKey = ENGINE_ORDER.includes(storedEngine as EngineKey)
    ? (storedEngine as EngineKey)
    : (homepageConfig.search.defaultEngine as EngineKey)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [engineDropdownOpen, setEngineDropdownOpen] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const engine = homepageConfig.search.engines[engineKey]
  const meta = engineMeta[engineKey]

  const addHistory = (term: string, engineKey: EngineKey) => {
    const trimmed = term.trim()
    if (!trimmed) return
    setHistory((prev) => {
      const normalized = Array.isArray(prev)
        ? prev.map(normalizeHistoryItem).filter((item) => item.query.trim() !== '')
        : []
      const next = normalized.filter((item) => item.query.toLowerCase() !== trimmed.toLowerCase())
      next.unshift({ query: trimmed, engine: engineKey })
      return next.slice(0, MAX_HISTORY)
    })
  }

  const removeHistory = (query: string) => {
    setHistory((prev) =>
      (Array.isArray(prev) ? prev.map(normalizeHistoryItem) : []).filter((item) => item.query !== query),
    )
  }

  const clearHistory = () => setHistory([])

  const selectEngine = useCallback(
    (key: EngineKey) => {
      setEngineKey(key)
      setEngineDropdownOpen(false)
      inputRef.current?.focus()
    },
    [setEngineKey]
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed || !engine) return
    addHistory(trimmed, engineKey)
    setHistoryOpen(false)
    setEngineDropdownOpen(false)
    window.location.href = engine.url + encodeURIComponent(trimmed)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') {
        if (engineDropdownOpen) {
          setEngineDropdownOpen(false)
          if (document.activeElement === inputRef.current) {
            setHistoryOpen(true)
          }
          return
        }
        setHistoryOpen(false)
        inputRef.current?.blur()
      }
      if ((e.metaKey || e.ctrlKey) && /^[1-5]$/.test(e.key)) {
        e.preventDefault()
        const index = parseInt(e.key, 10) - 1
        selectEngine(ENGINE_ORDER[index])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [engineDropdownOpen, selectEngine])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setHistoryOpen(false)
        setEngineDropdownOpen(false)
      }
    }
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [])

  const filteredHistory = query.trim()
    ? history.filter((item) => item.query.toLowerCase().includes(query.toLowerCase()))
    : history

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="group relative mx-auto w-[85%] max-w-xl transition-all duration-500 ease-in-out hover:w-[95%] focus-within:w-[95%]">
        <form
          onSubmit={handleSubmit}
          className="relative flex w-full items-center rounded-full border border-white/25 bg-gradient-to-r from-orange-300/40 to-blue-300/40 px-12 py-2.5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] backdrop-blur-2xl transition-all duration-500 ease-in-out hover:border-white/40 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.35)] focus-within:border-white/40 focus-within:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.35)]"
        >
          <button
            type="button"
            onClick={() => {
              setEngineDropdownOpen((prev) => !prev)
              setHistoryOpen(false)
            }}
            className="absolute left-4 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 focus:outline-none"
            aria-label="选择搜索引擎"
          >
            <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-focus-within:opacity-100">
              {meta.icon}
            </span>
            <Search className="pointer-events-none h-4 w-4 opacity-100 transition-opacity duration-300 group-focus-within:opacity-0" />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              setHistoryOpen(true)
              setEngineDropdownOpen(false)
            }}
            placeholder="搜索"
            className="w-full bg-transparent text-center text-lg text-white placeholder:text-white/70 focus:outline-none"
          />

          <button
            type="submit"
            className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-white/80 opacity-0 transition-all duration-300 hover:bg-white/10 group-hover:opacity-100 group-focus-within:opacity-100"
            aria-label="搜索"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {engineDropdownOpen && (
          <div className="absolute left-4 top-full z-50 mt-3 w-52 overflow-hidden rounded-3xl border border-white/10 bg-black/30 p-2 shadow-2xl backdrop-blur-2xl">
            <div className="flex flex-col gap-0.5">
              {ENGINE_ORDER.map((key) => {
                const m = engineMeta[key]
                const isSelected = key === engineKey
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => selectEngine(key)}
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-sm transition ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-sm">
                        {m.icon}
                      </span>
                      <span>{m.name}</span>
                    </span>
                    <span className="flex items-center gap-0.5 text-xs text-white/50">
                      <kbd className="rounded bg-white/10 px-1 py-0.5">⌘</kbd>
                      <kbd className="rounded bg-white/10 px-1 py-0.5">
                        {m.shortcut}
                      </kbd>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {historyOpen && !engineDropdownOpen && filteredHistory.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-40 mt-3 w-full overflow-hidden rounded-3xl border border-white/10 bg-black/30 p-3 shadow-2xl backdrop-blur-2xl">
            <ul className="flex flex-col gap-1">
              {filteredHistory.map((item) => {
                const itemMeta = engineMeta[item.engine]
                return (
                  <li key={item.query} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setQuery(item.query)
                        selectEngine(item.engine)
                      }}
                      className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-white/80 transition hover:bg-white/10"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-white/10 text-xs">
                        {itemMeta.smallIcon}
                      </span>
                      <span className="truncate">{item.query}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeHistory(item.query)}
                      className="rounded-xl p-2 text-white/50 transition hover:bg-white/10 hover:text-white/80"
                      aria-label="Remove from history"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="mt-1 border-t border-white/10 pt-2">
              <button
                type="button"
                onClick={clearHistory}
                className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs text-white/50 transition hover:bg-white/10 hover:text-white/80"
              >
                <Trash2 className="h-3.5 w-3.5" />
                清除历史记录
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
