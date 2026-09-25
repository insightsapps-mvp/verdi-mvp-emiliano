/** @type {import('tailwindcss').Config} */
const c = (v) => `rgb(var(--${v}) / <alpha-value>)`

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: c('bg'),
        surface: c('surface'),
        surface2: c('surface-2'),
        line: c('border'),
        fg: c('text'),
        muted: c('text-2'),
        primary: { DEFAULT: c('primary'), hover: c('primary-hover'), soft: c('primary-soft') },
        secondary: { DEFAULT: c('secondary'), soft: c('secondary-soft') },
        danger: { DEFAULT: c('danger'), soft: c('danger-soft') },
        warning: { DEFAULT: c('warning'), soft: c('warning-soft') },
        info: { DEFAULT: c('info'), soft: c('info-soft') },
        chat: { DEFAULT: c('chat'), bubble: c('chat-bubble'), bg: c('chat-bg') },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: { card: '12px' },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,.05)',
        pop: '0 12px 32px -8px rgba(0,0,0,.18), 0 2px 6px rgba(0,0,0,.06)',
      },
    },
  },
  plugins: [],
}
