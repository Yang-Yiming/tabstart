import { useEffect, useRef, useState } from 'react'
import { Search, Trash2 } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { homepageConfig } from '../config/homepage'

const HISTORY_KEY = 'homepage-search-history'
const MAX_HISTORY = 8

export function SearchWidget() {
  const [query, setQuery] = useState('')
  const [engineKey, setEngineKey] = useState(homepageConfig.search.defaultEngine)
  const [history, setHistory] = useLocalStorage<string[]>(HISTORY_KEY, [])
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const engine = homepageConfig.search.engines[engineKey]

  const addHistory = (term: string) => {
    const trimmed = term.trim()
    if (!trimmed) return
    setHistory((prev) => {
      const next = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())
      next.unshift(trimmed)
      return next.slice(0, MAX_HISTORY)
    })
  }

  const removeHistory = (term: string) => {
    setHistory((prev) => prev.filter((item) => item !== term))
  }

  const clearHistory = () => setHistory([])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed || !engine) return
    addHistory(trimmed)
    window.location.href = engine.url + encodeURIComponent(trimmed)
  }

  const cycleEngine = () => {
    const keys = Object.keys(homepageConfig.search.engines)
    const next = keys[(keys.indexOf(engineKey) + 1) % keys.length]
    setEngineKey(next)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [])

  const filteredHistory = query.trim()
    ? history.filter((item) => item.toLowerCase().includes(query.toLowerCase()))
    : history

  return (
    <div ref={containerRef} className="relative w-full">
      <form
        onSubmit={handleSubmit}
        className="group flex items-center gap-3 rounded-full border border-white/10 bg-black/25 px-5 py-3.5 shadow-2xl backdrop-blur-2xl transition-all duration-300 focus-within:border-white/25 focus-within:bg-black/35 focus-within:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.45)] hover:border-white/20 hover:bg-black/30"
      >
        <Search className="h-5 w-5 shrink-0 text-white/70" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="搜索"
          className="flex-1 bg-transparent text-lg text-white placeholder:text-white/50 focus:outline-none"
        />
        <button
          type="button"
          onClick={cycleEngine}
          className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80 transition hover:bg-white/20"
        >
          {engine?.name ?? 'Search'}
        </button>
      </form>

      {open && filteredHistory.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-3 overflow-hidden rounded-3xl border border-white/10 bg-black/30 p-3 shadow-2xl backdrop-blur-2xl">
          <ul className="flex flex-col gap-1">
            {filteredHistory.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setQuery(item)
                    inputRef.current?.focus()
                  }}
                  className="flex-1 truncate rounded-xl px-3 py-2 text-left text-sm text-white/80 transition hover:bg-white/10"
                >
                  {item}
                </button>
                <button
                  type="button"
                  onClick={() => removeHistory(item)}
                  className="rounded-xl p-2 text-white/50 transition hover:bg-white/10 hover:text-white/80"
                  aria-label="Remove from history"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
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
  )
}
