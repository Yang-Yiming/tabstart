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
            '--search-shell-bg': 'linear-gradient(90deg, rgba(255, 255, 255, 0.18), rgba(180, 220, 255, 0.18))',
            '--search-shell-border': 'rgba(255, 255, 255, 0.35)',
            '--search-shell-blur': '32px',
            '--search-shell-shadow': '0 12px 44px -12px rgba(0, 0, 0, 0.38)',
            '--search-shell-hover-border': 'rgba(255, 255, 255, 0.5)',
            '--search-shell-hover-shadow': '0 24px 60px -14px rgba(0, 0, 0, 0.45)',
            '--search-popover-bg': 'rgba(24, 30, 48, 0.5)',
            '--search-popover-border': 'rgba(255, 255, 255, 0.18)',
            '--search-popover-blur': '32px',
            '--clock-time-text': 'rgba(255, 255, 255, 0.96)',
            '--clock-date-text': 'rgba(255, 255, 255, 0.78)',
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
