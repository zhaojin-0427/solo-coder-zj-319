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
          50: '#FFF4EC',
          100: '#FFE6D5',
          200: '#FFCCAA',
          300: '#FFB07E',
          400: '#F59056',
          500: '#E87A3F',
          600: '#D16428',
          700: '#B04E1C',
          800: '#8A3C14',
          900: '#632B0E',
        },
        warm: {
          50: '#FFFCF8',
          100: '#FFF8F0',
          200: '#FDEFE0',
          300: '#F8E2C8',
          400: '#EFD0A8',
          500: '#E2B982',
        },
        sage: {
          50: '#F2F7EE',
          100: '#E3EDDB',
          200: '#C7DBB7',
          300: '#A4C48A',
          400: '#7BA05B',
          500: '#5F8044',
        },
        brown: {
          50: '#F8F4F0',
          100: '#EFE7DF',
          200: '#DCC8B7',
          300: '#C4A58D',
          400: '#A67F64',
          500: '#8B6247',
          600: '#6D4B35',
          700: '#553928',
          800: '#3D2B1F',
          900: '#2A1C14',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 20px rgba(139, 98, 71, 0.1)',
        'card-hover': '0 8px 30px rgba(139, 98, 71, 0.18)',
      },
    },
  },
  plugins: [],
};
