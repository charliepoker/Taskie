import type { ThemeConfig } from 'antd';

// Taskie Custom Ant Design Theme
export const taskieTheme: ThemeConfig = {
  token: {
    // Brand Colors
    colorPrimary: '#0D65F2', // Primary blue
    colorSuccess: '#52C41A', // Success green
    colorWarning: '#FA8C16', // Warning orange
    colorError: '#FF4D4F', // Error red
    colorInfo: '#0D65F2', // Info uses primary blue

    // Background Colors
    colorBgBase: '#ffffff',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f5f5f5',
    colorBgSpotlight: '#fee9f0', // Secondary pink for highlights
    colorBgMask: 'rgba(0, 0, 0, 0.45)',

    // Text Colors
    colorText: '#262626', // Text dark
    colorTextSecondary: '#595959', // Text light
    colorTextTertiary: '#8c8c8c', // Neutral gray
    colorTextQuaternary: '#bfbfbf',

    // Border Colors
    colorBorder: '#d9d9d9',
    colorBorderSecondary: '#e8e8e8',

    // Typography
    fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif',
    fontSize: 14,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,
    fontSizeLG: 16,
    fontSizeSM: 12,
    fontSizeXL: 20,

    // Line Heights
    lineHeight: 1.5,
    lineHeightHeading1: 1.2,
    lineHeightHeading2: 1.3,
    lineHeightHeading3: 1.3,
    lineHeightHeading4: 1.4,
    lineHeightHeading5: 1.5,
    lineHeightLG: 1.5,
    lineHeightSM: 1.66,

    // Font Weights
    fontWeightStrong: 600,

    // Spacing
    padding: 16,
    paddingXS: 8,
    paddingSM: 12,
    paddingLG: 24,
    paddingXL: 32,
    margin: 16,
    marginXS: 8,
    marginSM: 12,
    marginLG: 24,
    marginXL: 32,

    // Border Radius
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,
    borderRadiusXS: 2,

    // Shadows
    boxShadow:
      '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
    boxShadowSecondary:
      '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
    boxShadowTertiary:
      '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',

    // Control Heights
    controlHeight: 32,
    controlHeightLG: 40,
    controlHeightSM: 24,
    controlHeightXS: 16,

    // Motion
    motionDurationFast: '0.1s',
    motionDurationMid: '0.2s',
    motionDurationSlow: '0.3s',
    motionEaseInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
    motionEaseOut: 'cubic-bezier(0.215, 0.61, 0.355, 1)',

    // Z-Index
    zIndexBase: 0,
    zIndexPopupBase: 1000,
  },
  components: {
    // Button Component
    Button: {
      colorPrimary: '#0D65F2',
      algorithm: true,
      primaryShadow: '0 2px 0 rgba(13, 101, 242, 0.1)',
      defaultShadow: '0 2px 0 rgba(0, 0, 0, 0.02)',
      dangerShadow: '0 2px 0 rgba(255, 77, 79, 0.1)',
      borderRadius: 6,
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 24,
      paddingInline: 15,
      paddingInlineLG: 15,
      paddingInlineSM: 7,
      fontWeight: 500,
    },

    // Input Component
    Input: {
      borderRadius: 6,
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 24,
      paddingInline: 11,
      paddingBlock: 4,
    },

    // Card Component
    Card: {
      colorBorderSecondary: '#e8e8e8',
      borderRadiusLG: 8,
      paddingLG: 24,
      boxShadowTertiary:
        '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
    },

    // Modal Component
    Modal: {
      borderRadiusLG: 8,
      paddingLG: 24,
      paddingMD: 20,
      paddingContentHorizontalLG: 24,
      titleFontSize: 16,
      titleLineHeight: 1.5,
    },

    // Table Component
    Table: {
      borderColor: '#e8e8e8',
      headerBg: '#fafafa',
      headerColor: '#262626',
      rowHoverBg: '#fee9f0', // Secondary pink for hover
      borderRadius: 6,
      borderRadiusLG: 8,
    },

    // Menu Component
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#fee9f0', // Secondary pink for selected
      itemSelectedColor: '#0D65F2', // Primary blue for selected text
      itemHoverBg: '#f5f5f5',
      itemHoverColor: '#0D65F2',
      itemActiveBg: '#fee9f0',
      borderRadius: 6,
    },

    // Tag Component
    Tag: {
      borderRadiusSM: 4,
      fontSizeSM: 12,
      lineHeightSM: 1.5,
    },

    // Badge Component
    Badge: {
      colorPrimary: '#0D65F2',
      colorSuccess: '#52C41A',
      colorWarning: '#FA8C16',
      colorError: '#FF4D4F',
    },

    // Notification Component
    Notification: {
      borderRadiusLG: 8,
      paddingMD: 16,
      paddingContentHorizontal: 24,
    },

    // Message Component
    Message: {
      borderRadiusLG: 8,
    },

    // Tooltip Component
    Tooltip: {
      borderRadius: 6,
      paddingSM: 8,
      fontSize: 12,
    },

    // Popover Component
    Popover: {
      borderRadiusOuter: 8,
      paddingXS: 12,
    },

    // Dropdown Component
    Dropdown: {
      borderRadiusOuter: 8,
      paddingBlock: 4,
    },

    // Select Component
    Select: {
      borderRadius: 6,
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 24,
      optionSelectedBg: '#fee9f0', // Secondary pink for selected option
      optionSelectedColor: '#0D65F2',
      optionActiveBg: '#f5f5f5',
    },

    // DatePicker Component
    DatePicker: {
      borderRadius: 6,
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 24,
    },

    // Switch Component
    Switch: {
      colorPrimary: '#0D65F2',
      borderRadius: 100,
    },

    // Checkbox Component
    Checkbox: {
      borderRadiusSM: 2,
      colorPrimary: '#0D65F2',
    },

    // Radio Component
    Radio: {
      colorPrimary: '#0D65F2',
    },

    // Progress Component
    Progress: {
      colorSuccess: '#52C41A',
      borderRadius: 100,
    },

    // Spin Component
    Spin: {
      colorPrimary: '#0D65F2',
    },

    // Divider Component
    Divider: {
      colorSplit: '#e8e8e8',
      marginLG: 24,
    },

    // Typography Component
    Typography: {
      titleMarginBottom: 16,
      titleMarginTop: 16,
    },
  },
  algorithm: undefined, // Use default algorithm
};

// Dark theme variant (for future use)
export const taskieDarkTheme: ThemeConfig = {
  ...taskieTheme,
  token: {
    ...taskieTheme.token,
    colorBgBase: '#141414',
    colorBgContainer: '#1f1f1f',
    colorBgElevated: '#262626',
    colorBgLayout: '#000000',
    colorText: '#ffffff',
    colorTextSecondary: '#a6a6a6',
    colorTextTertiary: '#737373',
    colorBorder: '#424242',
    colorBorderSecondary: '#303030',
  },
};

export default taskieTheme;
