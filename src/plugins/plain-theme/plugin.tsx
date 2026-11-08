import type { HomepageContext, HomepagePlugin } from '../runtime'
import themeCss from './theme.css?inline'

const plainThemePlugin: HomepagePlugin = {
  id: 'plain-theme',
  name: 'Plain',
  description: '不依赖壁纸与毛玻璃的极简平面主题，提供自动适配明暗模式的纯色表面与细边框视觉。',
  builtin: true,
  order: 210,
  apply(ctx: HomepageContext) {
    ctx.effect(() =>
      ctx.themes.register({
        id: 'plain-theme',
        name: 'Plain',
        description: '纯色背景、低阴影、细边框的极简平面主题。',
        rootClass: 'theme-plain',
        supportsWallpaper: false,
        css: themeCss,
      }),
    )
  },
}

export const plugins = [plainThemePlugin]
