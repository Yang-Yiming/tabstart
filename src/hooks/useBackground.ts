import { useCallback, useEffect, useRef, useState } from 'react'
import { homepageConfig } from '../config/homepage'
import {
  fetchBingDailyImage,
  isBingImageUrl,
  localDateKey,
  sizedBingWallpaperUrl,
  type BingDailyImage,
} from '../lib/bingImage'
import {
  deleteBackgroundImage,
  loadBackgroundImage,
  saveBackgroundImage,
} from '../lib/imageStore'
import { useStoredState } from './useLocalStorage'

export interface BackgroundState {
  src: string
  overlay: number
  mode: 'url' | 'file' | 'bing'
}

type SetBackground = (value: BackgroundState | ((prev: BackgroundState) => BackgroundState)) => void

export interface BackgroundControls {
  bg: BackgroundState
  setBg: SetBackground
  bgHydrated: boolean
  backgroundSrc: string
  fileInputRef: React.RefObject<HTMLInputElement | null>
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  applyUrl: (url: string) => void
  applyBing: () => void
}

/**
 * Viewport size in device pixels, tracked live. The wallpaper is requested at
 * the resolution of the screen showing it, so a maximize or a move to a denser
 * display should re-request instead of upscaling the smaller image.
 */
function useWallpaperPixels() {
  const [pixels, setPixels] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: window.devicePixelRatio,
  }))

  useEffect(() => {
    let frame = 0
    const schedule = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        setPixels((prev) => {
          const width = window.innerWidth
          const height = window.innerHeight
          const dpr = window.devicePixelRatio
          return prev.width === width && prev.height === height && prev.dpr === dpr
            ? prev
            : { width, height, dpr }
        })
      })
    }

    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('resize', schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return pixels
}

export function useBackground(): BackgroundControls {
  // No wallpaper until the stored state hydrates (or the daily fetch resolves).
  // Pointing this at the fallback mirror made every load start a redirect to the
  // 3.4 MB master before the real (sized, cached) URL was known.
  const [bg, setBg, bgHydrated] = useStoredState<BackgroundState>('homepage-background', {
    src: '',
    overlay: homepageConfig.background.overlay,
    mode: 'bing',
  })
  const [bingCache, setBingCache, bingCacheHydrated] = useStoredState<BingDailyImage | null>(
    'homepage-bing-cache',
    null,
  )
  const wallpaperPixels = useWallpaperPixels()
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const restoreFileBgRef = useRef(false)
  const uploadedFileRef = useRef(false)
  const autoCheckedBingDateRef = useRef<string | null>(null)
  const migratedDefaultBackgroundRef = useRef(false)

  // Existing installs with the old empty default should adopt Bing once.
  useEffect(() => {
    if (
      !bgHydrated ||
      migratedDefaultBackgroundRef.current ||
      bg.mode !== 'url' ||
      bg.src !== homepageConfig.background.src
    ) return

    migratedDefaultBackgroundRef.current = true
    // `''` means "Bing, URL not resolved yet"; the daily refresh fills it in.
    // Writing the fallback mirror here would make the first paint redirect to
    // the unsized 3.4 MB master.
    setBg((current) => ({ ...current, mode: 'bing', src: '' }))
  }, [bg.mode, bg.src, bgHydrated, setBg])

  // The custom image itself is persisted in IndexedDB; once the stored state
  // has hydrated, rebuild a session object URL for it. If the blob is missing
  // (cleared storage, IndexedDB unavailable) fall back to the default
  // background instead of keeping a dead reference.
  useEffect(() => {
    if (!bgHydrated || restoreFileBgRef.current) return
    restoreFileBgRef.current = true
    if (bg.mode !== 'file' || uploadedFileRef.current) return

    let cancelled = false
    loadBackgroundImage().then((record) => {
      if (cancelled) return
      if (!record) {
        setBg({
          src: homepageConfig.background.src,
          overlay: homepageConfig.background.overlay,
          mode: 'url',
        })
        return
      }
      setFileUrl(URL.createObjectURL(record.blob))
    })
    return () => {
      cancelled = true
      // Allow the re-run after a StrictMode double-mount to restore again.
      restoreFileBgRef.current = false
    }
  }, [bg.mode, bgHydrated, setBg])

  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl)
    }
  }, [fileUrl])

  const backgroundSrc = bg.mode === 'file' && fileUrl
    ? fileUrl
    : sizedBingWallpaperUrl(bg.src, wallpaperPixels.width, wallpaperPixels.height, wallpaperPixels.dpr)

  const releaseFileUrl = useCallback(() => {
    if (fileUrl) URL.revokeObjectURL(fileUrl)
    setFileUrl(null)
  }, [fileUrl])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    uploadedFileRef.current = true
    if (fileUrl) URL.revokeObjectURL(fileUrl)
    const url = URL.createObjectURL(file)
    setFileUrl(url)
    setBg((current) => ({ ...current, mode: 'file', src: '' }))
    // One fixed slot in IndexedDB: each upload overwrites the previous image.
    // On failure the blob URL above still serves this session.
    saveBackgroundImage(file, file.name).catch(() => {})
  }

  const refreshBingBackground = useCallback(async () => {
    const today = localDateKey()

    if (bingCache?.date === today) {
      setBg((current) => ({ ...current, mode: 'bing', src: bingCache.url }))
      return
    }

    const image = await fetchBingDailyImage()
    setBingCache(image)
    setBg((current) => ({ ...current, mode: 'bing', src: image.url }))
  }, [bingCache?.date, bingCache?.url, setBg, setBingCache])

  // Refresh the Bing wallpaper once per day while it is the active background.
  useEffect(() => {
    if (!bgHydrated || !bingCacheHydrated) return

    const today = localDateKey()
    if (autoCheckedBingDateRef.current === today) return

    const isCurrentBingBackground =
      bg.mode === 'bing' || isBingImageUrl(bg.src, bingCache?.url)

    if (!isCurrentBingBackground) return

    autoCheckedBingDateRef.current = today
    refreshBingBackground().catch(() => {})
  }, [bg.mode, bg.src, bgHydrated, bingCache?.url, bingCacheHydrated, refreshBingBackground])

  const applyUrl = useCallback(
    (url: string) => {
      const trimmed = url.trim()
      if (!trimmed) return
      releaseFileUrl()
      deleteBackgroundImage()
      setBg((current) => ({ ...current, mode: 'url', src: trimmed }))
    },
    [releaseFileUrl, setBg],
  )

  const applyBing = useCallback(() => {
    releaseFileUrl()
    deleteBackgroundImage()
    refreshBingBackground().catch(() => {})
  }, [refreshBingBackground, releaseFileUrl])

  return {
    bg,
    setBg,
    bgHydrated,
    backgroundSrc,
    fileInputRef,
    handleFileChange,
    applyUrl,
    applyBing,
  }
}
