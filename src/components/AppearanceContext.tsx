import { createContext } from 'react'
import type { MouseHaloConfig } from '../config/mouseHalo'
import { defaultMouseHaloConfig } from '../config/mouseHalo'

export const AppearanceContext = createContext<MouseHaloConfig>(defaultMouseHaloConfig)
