/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        bg: {
          base: '#0a0a0f',
          elevated: '#111118',
          overlay: '#18181f',
          card: '#1a1a24',
        },
        accent: {
          DEFAULT: '#00ff88',
          dim: '#00cc6a',
          muted: 'rgba(0,255,136,0.12)',
          border: 'rgba(0,255,136,0.25)',
        },
        warn: '#ffaa00',
        danger: '#ff4444',
        muted: '#4a4a5e',
        text: {
          primary: '#f0f0ff',
          secondary: '#9090aa',
          dim: '#5a5a72',
        }
      },
      animation: {
        'pulse-dot': 'pulse 1.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.4s ease',
        'waveform': 'waveform 1.2s ease-in-out infinite',
      },
      keyframes: {
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        waveform: {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%': { transform: 'scaleY(1)' },
        }
      }
    },
  },
  plugins: [],
}
