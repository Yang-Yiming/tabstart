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
    defaultEngine: 'google',
    engines: {
      google: { name: 'Google', url: 'https://www.google.com/search?q=' },
      bing: { name: 'Bing', url: 'https://www.bing.com/search?q=' },
      duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
      github: { name: 'GitHub', url: 'https://github.com/search?q=' },
      alphaxiv: { name: 'AlphaXiv', url: 'https://www.alphaxiv.org/?query=' },
    },
  },
}
