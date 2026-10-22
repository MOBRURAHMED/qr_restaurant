/**
 * Design Tokens Dictionary
 * Defines architectural design standards across the multi-tenant SaaS.
 * 
 * Visual Identity:
 * - Primary: Deep forest green (#1b4332)
 * - Accent: Warm amber / gold (#d97706)
 * - Background: Warm off-white (#faf8f5)
 * - Cards: White (#ffffff) with subtle borders (#e8e5e0)
 * - Text: Deep charcoal (#1c1e21)
 */

export const designTokens = {
  colors: {
    brand: {
      primary: '#1b4332',         // Deep forest green
      primaryHover: '#143628',
      primaryLight: '#e8f5e9',
      primaryDark: '#0f241a',
      accent: '#d97706',          // Warm amber / gold
      accentHover: '#b45309',
      accentLight: '#fef3c7',
      accentDark: '#92400e',
    },
    neutral: {
      50: '#faf8f5',              // Warm off-white background
      100: '#f4f1ea',
      200: '#e8e5e0',
      300: '#d5d1ca',
      400: '#a39f97',
      500: '#736f68',
      600: '#524e48',
      700: '#3a3733',
      800: '#262422',
      900: '#1c1e21',             // Deep charcoal text
      950: '#121314',
    },
    semantic: {
      success: '#15803d',
      successBg: '#f0fdf4',
      warning: '#b45309',
      warningBg: '#fffbeb',
      error: '#b91c1c',
      errorBg: '#fef2f2',
      info: '#1d4ed8',
      infoBg: '#eff6ff',
    },
    kitchen: {
      bg: '#121417',
      surface: '#1a1d22',
      border: '#2a2e36',
      textPrimary: '#f8fafc',
      textMuted: '#94a3b8',
      urgent: '#ef4444',
      caution: '#f59e0b',
      normal: '#22c55e',
    },
  },
  typography: {
    fontSans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    scale: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
  },
  radii: {
    none: '0px',
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.25rem',
    full: '9999px',
  },
  shadows: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.04)',
  },
  layout: {
    customerMaxWidth: '640px',
    adminSidebarWidth: '260px',
    topbarHeight: '60px',
  },
} as const;

export type DesignTokens = typeof designTokens;
