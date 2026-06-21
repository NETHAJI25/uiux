/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        display: ['"Instrument Serif"', 'serif'],
        serif: ['"Instrument Serif"', 'serif'],
        podium: ['"FSP DEMO - PODIUM Sharp 4.11"', 'sans-serif'],
        grotesk: ['Anton', 'sans-serif'],
        condiment: ['Condiment', 'cursive'],
        helvetica: ['"Helvetica Regular"', 'Helvetica', 'Arial', 'sans-serif'],
        askan: ['"Askan Light"', 'serif'],
        almarai: ['Almarai', 'sans-serif'],
        anton: ['Anton', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
        'pp-neue': ['"PP Neue Montreal"', 'system-ui', 'sans-serif'],
        'pp-mondwest': ['"PP Mondwest"', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          green: '#9fff00',
        },
        'bg-base': '#EDEEF5',
        cream: '#EFF4FF',
        neon: '#6FFF00',
        primary: '#DEDBC8',
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(90deg, #89AACC 0%, #4E85BF 100%)',
      },
    },
  },
  plugins: [],
}
