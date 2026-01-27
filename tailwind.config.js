/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        'mega-sena': '#10b981',
        'lotofacil': '#d946ef',
        'quina': '#6366f1',
      },
    },
  },
  plugins: [],
}
