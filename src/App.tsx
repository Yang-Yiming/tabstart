import { Image, Moon, Sun, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Grid } from './components/Grid'
import { SearchWidget } from './widgets/SearchWidget'
import { ClockWidget } from './widgets/ClockWidget'
import { homepageConfig } from './config/homepage'
import { useLocalStorage } from './hooks/useLocalStorage'

interface BackgroundState {
  src: string
  overlay: number
  mode: 'url' | 'file'
}

export default function App() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false
    const stored = window.localStorage.getItem('homepage-theme')
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  const [bg, setBg] = useLocalStorage<BackgroundState>('homepage-background', {
    src: homepageConfig.background.src,
    overlay: homepageConfig.background.overlay,
    mode: 'url',
  })
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const resetFileBgRef = useRef(false)

  useEffect(() => {
    const root = window.document.documentElement
    if (dark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    window.localStorage.setItem('homepage-theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    if (resetFileBgRef.current) return
    resetFileBgRef.current = true
    if (bg.mode === 'file') {
      setBg({
        src: homepageConfig.background.src,
        overlay: homepageConfig.background.overlay,
        mode: 'url',
      })
    }
  }, [bg.mode, setBg])

  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl)
    }
  }, [fileUrl])

  const backgroundSrc = bg.mode === 'file' && fileUrl ? fileUrl : bg.src

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (fileUrl) URL.revokeObjectURL(fileUrl)
    const url = URL.createObjectURL(file)
    setFileUrl(url)
    setBg({ ...bg, mode: 'file', src: url })
  }

  const setUrlBackground = (src: string) => {
    setBg({ ...bg, mode: 'url', src })
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${backgroundSrc})` }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, rgba(0,0,0,${Math.max(0.1, bg.overlay - 0.15)}) 0%, rgba(0,0,0,${bg.overlay}) 70%)`,
        }}
      />

      <div className="absolute right-5 top-5 z-50 flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-full border border-white/15 bg-black/20 p-2.5 text-white/80 shadow-lg backdrop-blur-xl transition hover:bg-white/10 hover:text-white"
          aria-label="Upload background"
          title="Upload background"
        >
          <Upload className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setUrlBackground(homepageConfig.background.src)}
          className="rounded-full border border-white/15 bg-black/20 p-2.5 text-white/80 shadow-lg backdrop-blur-xl transition hover:bg-white/10 hover:text-white"
          aria-label="Use default background"
          title="Use default background"
        >
          <Image className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setDark((d) => !d)}
          className="rounded-full border border-white/15 bg-black/20 p-2.5 text-white/80 shadow-lg backdrop-blur-xl transition hover:bg-white/10 hover:text-white"
          aria-label="Toggle theme"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-24">
        <div className="w-full max-w-5xl">
          <div className="mx-auto mb-10 max-w-3xl">
            <ClockWidget />
          </div>
          <div className="mx-auto mb-16 max-w-2xl">
            <SearchWidget />
          </div>
          <Grid />
        </div>
      </div>
    </div>
  )
}
