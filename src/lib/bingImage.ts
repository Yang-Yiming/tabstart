export interface BingDailyImage {
  date: string
  url: string
  title?: string
}

interface BingArchiveResponse {
  images?: Array<{
    copyright?: string
    startdate?: string
    title?: string
    url?: string
    urlbase?: string
  }>
}

const BING_ORIGIN = 'https://www.bing.com'
const BING_ARCHIVE_URL = `${BING_ORIGIN}/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=zh-CN`

export const BING_DAILY_FALLBACK_URL = 'https://bing.ee123.net/img/4k'

/** Bing OHR wallpapers are 16:9 at every size the CDN serves. */
const BING_WALLPAPER_ASPECT = 16 / 9
/** The master `_UHD.jpg` is 3840×2160 and is also the ceiling we request. */
const BING_WALLPAPER_MAX_WIDTH = 3840
/** Below this the cover-sized wallpaper starts to soften on large displays. */
const BING_WALLPAPER_MIN_WIDTH = 1280
/** Quantize the request so dragging a window doesn't spawn a URL per pixel. */
const BING_WALLPAPER_WIDTH_STEP = 256
/** Retina beyond 2× costs bytes without being visible on a full-bleed photo. */
const BING_WALLPAPER_MAX_DPR = 2

/** Only these CDN URLs accept on-demand `w`/`h` re-encoding. */
const BING_THUMB_URL = /^https?:\/\/(?:[a-z0-9-]+\.)*bing\.com\/th\?/

/**
 * Ask Bing's CDN for a wallpaper no larger than the screen that will show it.
 *
 * Without `w`/`h` the CDN hands back the full 3840×2160 master (~3.4 MB, and
 * ~2.5 s on a 20 Mbit/s line); with them it re-encodes server-side and the same
 * framing costs ~100 KB. Requests stay 16:9 so the CSS `cover` crop matches the
 * master exactly, and the width is quantized so resizing the window doesn't
 * trigger a new download per pixel. Non-CDN URLs pass through untouched.
 */
export function sizedBingWallpaperUrl(
  url: string,
  viewportWidth: number,
  viewportHeight: number,
  devicePixelRatio: number,
): string {
  if (!BING_THUMB_URL.test(url) || /[?&]w=\d+/.test(url)) return url
  if (!(viewportWidth > 0) || !(viewportHeight > 0)) return url

  const dpr = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0
    ? Math.min(devicePixelRatio, BING_WALLPAPER_MAX_DPR)
    : 1
  // `background-size: cover` fills both axes, so the wider constraint wins.
  const needed = Math.max(viewportWidth, viewportHeight * BING_WALLPAPER_ASPECT) * dpr
  const width = Math.min(
    BING_WALLPAPER_MAX_WIDTH,
    Math.max(BING_WALLPAPER_MIN_WIDTH, Math.ceil(needed / BING_WALLPAPER_WIDTH_STEP) * BING_WALLPAPER_WIDTH_STEP),
  )
  const height = Math.round(width / BING_WALLPAPER_ASPECT)

  return `${url}&w=${width}&h=${height}&rs=1&c=4`
}

export function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isBingImageUrl(url: string, cachedUrl?: string) {
  if (!url) return false
  return (
    url === BING_DAILY_FALLBACK_URL ||
    (Boolean(cachedUrl) && url === cachedUrl) ||
    /\/\/(?:www\.)?bing\.com\/.*[?&]id=OHR\./.test(url) ||
    /\/\/(?:www\.)?bing\.com\/.*\/OHR\./.test(url)
  )
}

function resolveBingImageUrl(image: NonNullable<BingArchiveResponse['images']>[number]) {
  if (image.urlbase) return `${BING_ORIGIN}${image.urlbase}_UHD.jpg`
  if (image.url?.startsWith('http')) return image.url
  if (image.url) return `${BING_ORIGIN}${image.url}`
  return null
}

export async function fetchBingDailyImage(): Promise<BingDailyImage> {
  const date = localDateKey()

  try {
    const response = await fetch(BING_ARCHIVE_URL)
    const data = (await response.json()) as BingArchiveResponse
    const image = data.images?.[0]
    const url = image ? resolveBingImageUrl(image) : null

    if (url) {
      return {
        date,
        url,
        title: image?.title || image?.copyright,
      }
    }
  } catch {
    // Fall through to the redirect-based endpoint used by older versions.
  }

  try {
    // Only the redirect target is needed here, and the target is the ~3.4 MB
    // master JPEG: a GET would download the whole body (the caller never reads
    // it) just to read `response.url`. HEAD walks the same redirect chain for
    // zero bytes.
    const response = await fetch(BING_DAILY_FALLBACK_URL, { method: 'HEAD' })
    return {
      date,
      url: response.url || BING_DAILY_FALLBACK_URL,
    }
  } catch {
    return {
      date,
      url: BING_DAILY_FALLBACK_URL,
    }
  }
}
