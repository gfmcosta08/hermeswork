/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#FCE382',
          yellow: '#E4E982',
          coral: '#DF8B82',
          gray: '#DFE0E5',
          dark: '#2A2A2A',
          ocre: '#D59846',
          turquoise: '#86C9CD',
          petrol: '#65B1B7',
          pastel: '#CAD5DD',
          brown: '#9E7452',
        }
      }
    },
  },
  plugins: [],
}