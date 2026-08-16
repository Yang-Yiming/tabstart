import { useCallback, useEffect, useRef, useState } from 'react'
import { homepageConfig } from '../config/homepage'
import {
  fetchBingDailyImage,
  BING_DAILY_FALLBACK_URL,
  isBingImageUrl,
  localDateKey,
  type BingDailyImage,
} from '../lib/bingImage'
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

export function useBackground(): BackgroundControls {
  const [bg, setBg, bgHydrated] = useStoredState<BackgroundState>('homepage-background', {
    src: BING_DAILY_FALLBACK_URL,
    overlay: homepageConfig.background.overlay,
    mode: 'bing',
  })
  const [bingCache, setBingCache, bingCacheHydrated] = useStoredState<BingDailyImage | null>(
    'homepage-bing-cache',
    null,
  )
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const resetFileBgRef = useRef(false)
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
    setBg((current) => ({ ...current, mode: 'bing', src: BING_DAILY_FALLBACK_URL }))
  }, [bg.mode, bg.src, bgHydrated, setBg])

  // A blob URL persisted from a previous session is no longer valid, so fall back
  // to the default background if the stored mode is 'file'.
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
    setBg((current) => ({ ...current, mode: 'file', src: url }))
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
      setBg((current) => ({ ...current, mode: 'url', src: trimmed }))
    },
    [setBg],
  )

  const applyBing = useCallback(() => {
    refreshBingBackground().catch(() => {})
  }, [refreshBingBackground])

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
