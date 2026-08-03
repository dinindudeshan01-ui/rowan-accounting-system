import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        rowan: {
          navy: '#06154b',
          navyLight: '#122a7a',
          red: '#e60026',
          redDark: '#5c0011',
          bg: '#e8eaf0',
          bgWhite: '#f8f9fc',
        },
      },
      fontFamily: {
        display: ["'Playfair Display'", 'serif'],
        body: ["'Montserrat'", 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
