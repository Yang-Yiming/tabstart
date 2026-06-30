import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { WidgetCard } from '../components/WidgetCard'
import { homepageConfig } from '../config/homepage'

export function SearchWidget() {
  const [query, setQuery] = useState('')
  const [engineKey, setEngineKey] = useState(homepageConfig.search.defaultEngine)
  const inputRef = useRef<HTMLInputElement>(null)

  const engine = homepageConfig.search.engines[engineKey]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed || !engine) return
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
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <WidgetCard>
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <Search className="h-6 w-6 shrink-0 text-accent dark:text-accent-dark" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the web..."
          className="flex-1 bg-transparent text-xl text-text-primary placeholder:text-text-muted focus:outline-none dark:text-text-primary-dark"
        />
        <button
          type="button"
          onClick={cycleEngine}
          className="shrink-0 rounded-lg bg-panel-highlight px-3 py-1.5 text-sm font-medium text-accent transition hover:bg-accent/10 dark:bg-panel-highlight-dark dark:text-accent-dark"
        >
          {engine?.name ?? 'Search'}
        </button>
      </form>
    </WidgetCard>
  )
}
