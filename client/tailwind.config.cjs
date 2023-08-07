// const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  // darkMode: 'class',
  darkMode: ['class'],
  theme: {
    // colors: {
    //   'gpt-dark-gray': '#343541',
    // },
    fontFamily: {
      sans: ['Söhne', 'sans-serif'],
      mono: ['Söhne Mono', 'monospace'],
    },
    extend: {
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      colors: {
        sidekickgray: {
          100: '#262626',
          200: '#171717',
        },
        sidekickpurple: {
          100: '#8F01CE',
          200: '#7d01b2',
        },
        gray: {
          50: '#f7f7f8',
          100: '#d9d9e3',
          200: '#d9d9e3', // Replacing .bg-gray-200
          300: '#c5c5d2',
          400: '#acacb1',
          500: '#8e8ea0',
          600: '#565869',
          700: '#40414f', // Replacing .dark .dark:bg-gray-700 and .dark .dark:hover:bg-gray-700:hover
          800: '#343541', // Replacing .dark .dark:bg-gray-800, .bg-gray-800, and .dark .dark:hover:bg-gray-800\/90
          900: '#202123', // Replacing .dark .dark:bg-gray-900, .bg-gray-900, and .dark .dark:hover:bg-gray-900:hover
          1000: '#444654',
        },
        green: {
          50: '#f1f9f7',
          100: '#def2ed',
          200: '#a6e5d6',
          300: '#6dc8b9',
          400: '#41a79d',
          500: '#10a37f',
          600: '#126e6b',
          700: '#0a4f53',
          800: '#06373e',
          900: '#031f29',
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('tailwindcss-radix')(),
    // require('@tailwindcss/typography'),
  ],
};
