/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sanctuary: {
          moss: '#2D422E',
          forest: '#18281A',
          leaf: '#4E6E49',
          wood: '#5C4028',
          amber: '#D9A75A',
          sunlight: '#FFF6DC',
          mist: '#E6EFE6',
        }
      },
      fontFamily: {
        serif: ['"Noto Serif"', '"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
