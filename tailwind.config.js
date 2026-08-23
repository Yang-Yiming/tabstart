/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', './user-plugins/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        page: {
          DEFAULT: '#F6F7FA',
          dark: '#0B0F19',
        },
        panel: {
          DEFAULT: '#FFFFFF',
          highlight: '#F0F2F7',
          dark: '#151B2B',
          'highlight-dark': '#1E2740',
        },
        text: {
          primary: {
            DEFAULT: '#111827',
            dark: '#E8ECF5',
          },
          muted: {
            DEFAULT: '#64748B',
            dark: '#8E9ABA',
          },
        },
        accent: {
          DEFAULT: '#0284C7',
          dark: '#38BDF8',
        },
        border: {
          DEFAULT: 'rgba(15, 23, 42, 0.08)',
          dark: 'rgba(255, 255, 255, 0.05)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
