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
        'primary-blue': '#0D65F2',
        'secondary-pink': '#FEE9F0',
        'accent-gold': '#DFB032',
        'success-green': '#52C41A',
        'error-red': '#FF4D4F',
        'warning-orange': '#FA8C16',
        'neutral-gray': '#8C8C8C',
        'background-gray': '#F5F5F5',
        'text-dark': '#262626',
        'text-light': '#595959',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
