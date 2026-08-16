import type { HomepageContext } from '../runtime'

export const plugins = [
  {
    id: 'liquid-glass',
    name: 'Liquid Glass',
    description: '将主视觉切换为更通透的 liquid glass 玻璃拟态。',
    builtin: false,
    order: 200,
    apply(ctx: HomepageContext) {
      ctx.effect(() =>
        ctx.themes.register({
          id: 'liquid-glass',
          name: 'Liquid Glass',
          description: '更通透的玻璃拟态主题。',
          rootClass: 'theme-liquid-glass',
          tokens: {
            '--glass-widget-bg': 'rgba(255, 255, 255, 0.14)',
            '--glass-widget-border': 'rgba(255, 255, 255, 0.30)',
            '--glass-widget-hover-bg': 'rgba(255, 255, 255, 0.20)',
            '--glass-widget-hover-border': 'rgba(255, 255, 255, 0.40)',
            '--glass-widget-blur': '32px',
            '--glass-widget-saturate': '180%',
            '--glass-widget-shadow': '0 28px 80px -16px rgba(0, 0, 0, 0.45)',
            '--chrome-button-bg': 'rgba(255, 255, 255, 0.12)',
            '--chrome-button-border': 'rgba(255, 255, 255, 0.28)',
            '--chrome-button-text': 'rgba(255, 255, 255, 0.92)',
            '--chrome-button-hover-bg': 'rgba(255, 255, 255, 0.20)',
            '--chrome-button-hover-text': 'rgba(255, 255, 255, 1)',
            '--chrome-panel-bg': 'rgba(24, 30, 48, 0.55)',
            '--chrome-panel-border': 'rgba(255, 255, 255, 0.16)',
            '--chrome-panel-blur': '36px',
          },
          css: `
            [data-theme='liquid-glass'] body {
              background-color: #0b1220;
            }
            [data-theme='liquid-glass'] .chrome-button,
            [data-theme='liquid-glass'] .chrome-panel {
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
            }
            [data-theme='liquid-glass'] .react-grid-placeholder {
              border-color: rgba(255, 255, 255, 0.35) !important;
              background: rgba(255, 255, 255, 0.18) !important;
            }
          `,
        }),
      )
    },
  },
]
