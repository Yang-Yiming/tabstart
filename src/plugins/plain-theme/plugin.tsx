import type { HomepageContext, HomepagePlugin } from '../runtime'
import themeCss from './theme.css?inline'

const plainThemePlugin: HomepagePlugin = {
  id: 'plain-theme',
  name: 'Plain Theme',
  description: '纯色背景与细边框的极简平面主题。',
  builtin: true,
  order: 210,
  apply(ctx: HomepageContext) {
    ctx.effect(() =>
      ctx.themes.register({
        id: 'plain-theme',
        name: 'Plain Theme',
        description: '纯色背景与细边框的极简平面主题。',
        rootClass: 'theme-plain',
        supportsWallpaper: false,
        css: themeCss,
      }),
    )
  },
}

export const plugins = [plainThemePlugin]
