import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Search, Trash2 } from 'lucide-react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { homepageConfig } from '../config/homepage'

const HISTORY_KEY = 'homepage-search-history'
const MAX_HISTORY = 8

export function SearchWidget() {
  const [query, setQuery] = useState('')
  const [history, setHistory] = useLocalStorage<string[]>(HISTORY_KEY, [])
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const engine = homepageConfig.search.engines[homepageConfig.search.defaultEngine]

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
        className="group relative mx-auto flex w-[85%] max-w-xl items-center rounded-full border border-white/25 bg-gradient-to-r from-orange-300/40 to-blue-300/40 px-12 py-2.5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] backdrop-blur-2xl transition-all duration-500 ease-in-out hover:w-[95%] hover:border-white/40 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.35)] focus-within:w-[95%] focus-within:border-white/40 focus-within:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.35)]"
      >
        <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/80 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
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

      {open && filteredHistory.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mx-auto mt-3 w-[95%] max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-black/30 p-3 shadow-2xl backdrop-blur-2xl">
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
