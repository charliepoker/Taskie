// Design Tokens for Taskie Application
// This file contains all design tokens used throughout the application

export const colors = {
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
} as const;

export const typography = {
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
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  32: '8rem',
  40: '10rem',
  48: '12rem',
  56: '14rem',
  64: '16rem',
} as const;

export const borderRadius = {
  none: '0',
  sm: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px',
} as const;

export const boxShadow = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  none: '0 0 #0000',
} as const;

export const breakpoints = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const zIndex = {
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1020,
  banner: 1030,
  overlay: 1040,
  modal: 1050,
  popover: 1060,
  skipLink: 1070,
  toast: 1080,
  tooltip: 1090,
} as const;

export const animation = {
  duration: {
    fast: '0.1s',
    normal: '0.2s',
    slow: '0.3s',
  },
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// Component-specific tokens
export const components = {
  button: {
    height: {
      sm: '24px',
      md: '32px',
      lg: '40px',
    },
    padding: {
      sm: '0 8px',
      md: '0 16px',
      lg: '0 20px',
    },
    fontSize: {
      sm: typography.fontSize.sm[0],
      md: typography.fontSize.base[0],
      lg: typography.fontSize.lg[0],
    },
  },
  input: {
    height: {
      sm: '24px',
      md: '32px',
      lg: '40px',
    },
    padding: {
      sm: '0 8px',
      md: '0 12px',
      lg: '0 16px',
    },
  },
  card: {
    padding: {
      sm: spacing[4],
      md: spacing[6],
      lg: spacing[8],
    },
    borderRadius: borderRadius.lg,
    shadow: boxShadow.sm,
  },
} as const;

// Utility functions for accessing tokens
export const getColor = (color: string, shade?: number) => {
  const [colorName, colorShade] = color.split('-');
  const colorObj = colors[colorName as keyof typeof colors];

  if (!colorObj) return color;

  const shadeKey = shade || parseInt(colorShade) || 500;
  return colorObj[shadeKey as keyof typeof colorObj] || color;
};

export const getSpacing = (size: keyof typeof spacing) => {
  return spacing[size];
};

export const getFontSize = (size: keyof typeof typography.fontSize) => {
  return typography.fontSize[size];
};

export const getBorderRadius = (size: keyof typeof borderRadius) => {
  return borderRadius[size];
};

export const getBoxShadow = (size: keyof typeof boxShadow) => {
  return boxShadow[size];
};

// Export all tokens as a single object for easy access
export const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  boxShadow,
  breakpoints,
  zIndex,
  animation,
  components,
} as const;

export default designTokens;
