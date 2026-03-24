/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FFDE5B',
          dark: '#FFD035',
          light: '#FFF4D1',
          text: '#B8860B',
        },
        secondary: {
          DEFAULT: '#FF9800',
        },
        success: '#4CAF50',
        info: '#00BCD4',
        danger: '#F44336',
        purple: '#9C27B0',
        dark: {
          DEFAULT: '#1a1a2e',
          light: '#16213e',
          card: '#1e293b',
        },
        tmain: '#333333',
        tmuted: '#757575',
      },
      fontFamily: {
        sans: ['Prompt', 'sans-serif'],
        display: ['Kanit', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
