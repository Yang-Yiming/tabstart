import { useCallback, useEffect, useRef, useState } from 'react'
import { homepageConfig } from '../config/homepage'
import {
  fetchBingDailyImage,
  BING_DAILY_FALLBACK_URL,
  isBingImageUrl,
  localDateKey,
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
    setBg((current) => ({ ...current, mode: 'bing', src: BING_DAILY_FALLBACK_URL }))
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

  const backgroundSrc = bg.mode === 'file' && fileUrl ? fileUrl : bg.src

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
