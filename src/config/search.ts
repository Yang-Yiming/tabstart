export const SEARCH_ENGINE_ORDER = ['google', 'bing', 'duckduckgo', 'github', 'alphaxiv'] as const

export type SearchEngineKey = (typeof SEARCH_ENGINE_ORDER)[number]

export interface SearchEngineDefinition {
  key: SearchEngineKey
  name: string
  url: string
}

export const SEARCH_ENGINES: Record<SearchEngineKey, SearchEngineDefinition> = {
  google: {
    key: 'google',
    name: 'Google',
    url: 'https://www.google.com/search?q=',
  },
  bing: {
    key: 'bing',
    name: 'Bing',
    url: 'https://www.bing.com/search?q=',
  },
  duckduckgo: {
    key: 'duckduckgo',
    name: 'DuckDuckGo',
    url: 'https://duckduckgo.com/?q=',
  },
  github: {
    key: 'github',
    name: 'GitHub',
    url: 'https://github.com/search?q=',
  },
  alphaxiv: {
    key: 'alphaxiv',
    name: 'AlphaXiv',
    url: 'https://www.alphaxiv.org/?query=',
  },
}

export const DEFAULT_SEARCH_ENGINE: SearchEngineKey = 'google'

export const SEARCH_ENGINE_STORAGE_KEY = 'homepage-search-engine'
