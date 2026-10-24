import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pistachio: {
          50:  '#f5f8ee',
          100: '#e8f0d4',
          200: '#cfe0aa',
          300: '#afc97a',
          400: '#8faf6b',
          500: '#73924f',
          600: '#5a733d',
          700: '#465a31',
          800: '#3a4928',
          900: '#303e23',
        },
        cream: {
          50:  '#fdfcf9',
          100: '#f9f6ef',
          200: '#f5f0e8',
          300: '#ede4d2',
          400: '#ddd0b8',
          500: '#c8b89a',
        },
        blush: {
          50:  '#fdf4f4',
          100: '#fce8e9',
          200: '#f7cfd2',
          300: '#eeacb1',
          400: '#e8b4b8',
          500: '#d4848a',
          600: '#b85f66',
        },
        stone: {
          warm: '#a09080',
        },
      },
      fontFamily: {
        serif:  ['var(--font-playfair)', 'Georgia', 'serif'],
        sans:   ['var(--font-inter)',    'system-ui', 'sans-serif'],
        script: ['var(--font-dancing)', 'cursive'],
      },
      boxShadow: {
        polaroid: '0 4px 6px -1px rgba(0,0,0,.12), 0 10px 30px -5px rgba(0,0,0,.08)',
        card:     '0 2px 12px rgba(0,0,0,.06)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in':  'fade-in 1.2s ease-out forwards',
        'slide-up': 'slide-up 0.8s ease-out forwards',
      },
    },
  },
  plugins: [],
};

export default config;
