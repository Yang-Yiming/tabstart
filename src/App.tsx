import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Grid } from './components/Grid'
import { homepageConfig } from './config/homepage'

export default function App() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false
    const stored = window.localStorage.getItem('homepage-theme')
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const root = window.document.documentElement
    if (dark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    window.localStorage.setItem('homepage-theme', dark ? 'dark' : 'light')
  }, [dark])

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="relative min-h-screen overflow-hidden px-6 py-12">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px] dark:bg-accent/10" />
      <div className="relative mx-auto max-w-5xl">
        <header className="mb-10 text-center">
          <div className="mb-4 flex items-center justify-center gap-3">
            <h1 className="text-3xl font-medium tracking-tight text-text-primary">
              {greeting}
            </h1>
            <button
              type="button"
              aria-label="Toggle theme"
              onClick={() => setDark((d) => !d)}
              className="rounded-full border border-border bg-panel p-2 text-text-muted transition hover:text-accent dark:border-border-dark dark:bg-panel-dark dark:hover:text-accent-dark"
            >
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
          <p className="text-text-muted">{homepageConfig.title}</p>
        </header>
        <Grid />
      </div>
    </div>
  )
}
