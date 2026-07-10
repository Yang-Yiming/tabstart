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
    const response = await fetch(BING_DAILY_FALLBACK_URL)
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
