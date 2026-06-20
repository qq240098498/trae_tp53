/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: '#eef3f9',
          100: '#d6e1ee',
          200: '#adc9de',
          300: '#79a8c9',
          400: '#4b85b0',
          500: '#1e3a5f',
          600: '#1a3353',
          700: '#152944',
          800: '#102036',
          900: '#0b1728',
        },
        accent: {
          50: '#e8faf2',
          100: '#c7f3dd',
          200: '#8fe7bd',
          300: '#5dd59c',
          400: '#3eb489',
          500: '#2e9a73',
          600: '#257b5c',
          700: '#1e604a',
          800: '#184c3b',
          900: '#123d30',
        },
        warning: {
          50: '#fff3eb',
          100: '#ffe2cc',
          200: '#ffc099',
          300: '#ffa066',
          400: '#ff8c42',
          500: '#e57330',
          600: '#c05a22',
          700: '#994418',
          800: '#753310',
          900: '#542408',
        },
        surface: {
          50: '#f8fafc',
          100: '#f0f4f8',
          200: '#e2e8f0',
          300: '#cbd5e1',
        }
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'scan-line': 'scan-line 2s linear infinite',
        'breath': 'breath 2s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
      },
      keyframes: {
        'scan-line': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'breath': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
};
