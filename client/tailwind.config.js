/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          400: '#F4B942',
          500: '#E9A82E',
          600: '#D4941A',
        }
      }
    },
  },
  plugins: [],
}
