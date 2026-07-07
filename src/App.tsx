import { Globe, Image, Link, Moon, Sun, Upload } from 'lucide-react'
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

interface BingCache {
  date: string
  url: string
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
  const [bingCache, setBingCache] = useLocalStorage<BingCache | null>('homepage-bing-cache', null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const resetFileBgRef = useRef(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [urlInputOpen, setUrlInputOpen] = useState(false)
  const [urlValue, setUrlValue] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setUrlInputOpen(false)
      }
    }
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [])

  const backgroundSrc = bg.mode === 'file' && fileUrl ? fileUrl : bg.src

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (fileUrl) URL.revokeObjectURL(fileUrl)
    const url = URL.createObjectURL(file)
    setFileUrl(url)
    setBg({ ...bg, mode: 'file', src: url })
  }

  const applyBingBackground = async () => {
    setMenuOpen(false)
    const today = new Date().toISOString().slice(0, 10)

    if (bingCache?.date === today) {
      setBg({ ...bg, mode: 'url', src: bingCache.url })
      return
    }

    try {
      const response = await fetch('https://bing.ee123.net/img/4k')
      setBingCache({ date: today, url: response.url })
      setBg({ ...bg, mode: 'url', src: response.url })
    } catch {
      const fallback = 'https://bing.ee123.net/img/4k'
      setBg({ ...bg, mode: 'url', src: fallback })
    }
  }

  const handleUrlApply = () => {
    const trimmed = urlValue.trim()
    if (!trimmed) return
    setBg({ ...bg, mode: 'url', src: trimmed })
    setUrlInputOpen(false)
    setUrlValue('')
    setMenuOpen(false)
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
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setMenuOpen((v) => !v)
              setUrlInputOpen(false)
            }}
            className="rounded-full border border-white/15 bg-black/20 p-2.5 text-white/80 shadow-lg backdrop-blur-xl transition hover:bg-white/10 hover:text-white"
            aria-label="Wallpaper"
            title="Wallpaper"
          >
            <Image className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-1.5 shadow-2xl backdrop-blur-2xl">
              {urlInputOpen ? (
                <div className="flex flex-col gap-2 p-2">
                  <input
                    type="text"
                    value={urlValue}
                    onChange={(e) => setUrlValue(e.target.value)}
                    placeholder="输入图片URL..."
                    autoFocus
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setUrlInputOpen(false)
                        setUrlValue('')
                      }}
                      className="flex-1 rounded-xl px-3 py-1.5 text-xs text-white/60 transition hover:bg-white/10"
                    >
                      返回
                    </button>
                    <button
                      type="button"
                      onClick={handleUrlApply}
                      className="flex-1 rounded-xl bg-white/10 px-3 py-1.5 text-xs text-white transition hover:bg-white/20"
                    >
                      应用
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current?.click()
                      setMenuOpen(false)
                    }}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/80 transition hover:bg-white/10"
                  >
                    <Upload className="h-4 w-4" />
                    本地图片
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrlInputOpen(true)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/80 transition hover:bg-white/10"
                  >
                    <Link className="h-4 w-4" />
                    在线链接
                  </button>
                  <button
                    type="button"
                    onClick={applyBingBackground}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/80 transition hover:bg-white/10"
                  >
                    <Globe className="h-4 w-4" />
                    Bing 每日图像
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

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
