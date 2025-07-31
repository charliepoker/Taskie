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
        // Brand Colors
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#0D65F2', // Main brand blue
          600: '#0b56d1',
          700: '#0947b0',
          800: '#083a8f',
          900: '#072e6e',
        },
        secondary: {
          50: '#fef7f7',
          100: '#FEE9F0', // Main brand pink
          200: '#fdd3e0',
          300: '#fbb6cc',
          400: '#f892b3',
          500: '#f56b96',
          600: '#e94576',
          700: '#d12757',
          800: '#b01e47',
          900: '#8f1a3a',
        },
        accent: {
          50: '#fefbf3',
          100: '#fef4e6',
          200: '#fde8cc',
          300: '#fbd9a8',
          400: '#f8c574',
          500: '#DFB032', // Main brand gold
          600: '#c89a2d',
          700: '#a67f26',
          800: '#856620',
          900: '#6b521a',
        },
        // Semantic Colors
        success: {
          50: '#f6ffed',
          100: '#d9f7be',
          200: '#b7eb8f',
          300: '#95de64',
          400: '#73d13d',
          500: '#52C41A', // Success green
          600: '#389e0d',
          700: '#237804',
          800: '#135200',
          900: '#092b00',
        },
        error: {
          50: '#fff2f0',
          100: '#ffccc7',
          200: '#ffa39e',
          300: '#ff7875',
          400: '#ff4d4f', // Error red
          500: '#f5222d',
          600: '#cf1322',
          700: '#a8071a',
          800: '#820014',
          900: '#5c0011',
        },
        warning: {
          50: '#fff7e6',
          100: '#ffe7ba',
          200: '#ffd591',
          300: '#ffc069',
          400: '#ffad40',
          500: '#FA8C16', // Warning orange
          600: '#d46b08',
          700: '#ad4e00',
          800: '#873800',
          900: '#612500',
        },
        // Neutral Colors
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5', // Background gray
          200: '#e8e8e8',
          300: '#d9d9d9',
          400: '#bfbfbf',
          500: '#8C8C8C', // Neutral gray
          600: '#595959', // Text light
          700: '#434343',
          800: '#262626', // Text dark
          900: '#1f1f1f',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
        128: '32rem',
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      },
      screens: {
        xs: '475px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
