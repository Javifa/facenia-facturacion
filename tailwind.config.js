/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9fa',
          100: '#d9eff2',
          200: '#b6dfe6',
          300: '#83c7d4',
          400: '#49a6b9',
          500: '#2b889c',
          600: '#1d6c7e',
          700: '#165666',
          800: '#144d5b',
          900: '#133d48',
          950: '#0b262e',
        },
        slate: {
          850: '#131c2e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
        'card': '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)',
        'modal': '0 20px 25px -5px rgba(15, 23, 42, 0.18), 0 8px 10px -6px rgba(15, 23, 42, 0.08)',
      }
    },
  },
  plugins: [],
}
