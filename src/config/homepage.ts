import { DEFAULT_SEARCH_ENGINE, SEARCH_ENGINE_ORDER, SEARCH_ENGINES } from './search'

export interface SearchEngine {
  name: string
  url: string
}

export interface BackgroundConfig {
  src: string
  overlay: number
  blur?: number
}

export interface HomepageConfig {
  title: string
  background: BackgroundConfig
  search: {
    defaultEngine: string
    engines: Record<string, SearchEngine>
  }
}

export const homepageConfig: HomepageConfig = {
  title: 'Launchpad',
  background: {
    src: '',
    overlay: 0.3,
    blur: 0,
  },
  search: {
    defaultEngine: DEFAULT_SEARCH_ENGINE,
    engines: Object.fromEntries(
      SEARCH_ENGINE_ORDER.map((key) => [key, { name: SEARCH_ENGINES[key].name, url: SEARCH_ENGINES[key].url }]),
    ) as Record<string, SearchEngine>,
  },
}
