export interface ShineConfig {
  enabled: boolean
  opacity: number
  color: string
}

export interface MouseHaloConfig {
  enabled: boolean
  size: number
  color: string
  opacity: number
  blur: number
  blendMode: 'normal' | 'screen' | 'overlay' | 'soft-light' | 'color-dodge'
  smooth: number
  shine: ShineConfig
}

export const defaultShineConfig: ShineConfig = {
  enabled: true,
  opacity: 0.18,
  color: '#ffffff',
}

export const defaultMouseHaloConfig: MouseHaloConfig = {
  enabled: true,
  size: 320,
  color: '#ffffff',
  opacity: 0.16,
  blur: 48,
  blendMode: 'screen',
  smooth: 0.1,
  shine: defaultShineConfig,
}
