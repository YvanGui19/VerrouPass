/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Couleurs VerrouPass (primary blue)
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // Couleurs Chaos Engine (Entropy System)
        lime: '#C2FE0B',
        'lime-dim': '#9BBF18',
        cyan: '#01FFFF',
        grey: '#A1A1AA',
        'dark-navy': '#0A0E1A',
        'dark-blue': '#111827',
        'mid-navy': '#1C2333',
        background: '#0A0E1A',
        surface: '#111827',
      },
      fontFamily: {
        mono: ['"Share Tech Mono"', 'monospace'],
        heading: ['"Bebas Neue"', 'sans-serif'],
        display: ['"Orbitron"', 'sans-serif'],
        sans: ['"Rajdhani"', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(194, 254, 11, 0.3)',
        'glow-lg': '0 8px 30px rgba(194, 254, 11, 0.2)',
      },
    },
  },
  plugins: [],
}
