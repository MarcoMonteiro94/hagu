import { useColorScheme } from 'react-native'
import { colors, palette, priorityColors, statusColors, rarityColors, chartColors } from './colors'

// Re-export ThemeProvider
export { ThemeProvider, useThemeContext, useThemeWithProvider } from './ThemeProvider'
export type { ThemeMode } from './ThemeProvider'

// Re-export all color utilities
export {
  colors,
  palette,
  priorityColors,
  statusColors,
  rarityColors,
  chartColors,
  pickerColors,
  areaPickerColors,
  colorNames,
  getColorName,
} from './colors'
export type { PaletteColor, Priority, TaskStatus, Rarity } from './colors'

// =============================================================================
// Typography Scale (matches web Geist Sans system)
// =============================================================================

export const typography = {
  // Font sizes (in pixels, matching web rem values)
  size: {
    xs: 12,     // 0.75rem
    sm: 14,     // 0.875rem
    base: 16,   // 1rem
    lg: 18,     // 1.125rem
    xl: 20,     // 1.25rem
    '2xl': 24,  // 1.5rem
    '3xl': 30,  // 1.875rem
    '4xl': 36,  // 2.25rem
  },

  // Line heights
  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Font weights
  weight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Letter spacing
  tracking: {
    tighter: -0.8,
    tight: -0.4,
    normal: 0,
    wide: 0.4,
  },
} as const

// =============================================================================
// Spacing Scale (matches web Tailwind spacing)
// =============================================================================

export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
} as const

// =============================================================================
// Border Radius Scale (matches web --radius: 0.625rem base)
// =============================================================================

export const radius = {
  none: 0,
  sm: 6,      // calc(var(--radius) - 4px) = 6px
  md: 8,      // calc(var(--radius) - 2px) = 8px
  lg: 10,     // var(--radius) = 10px (0.625rem)
  xl: 14,     // calc(var(--radius) + 4px) = 14px
  '2xl': 18,  // calc(var(--radius) + 8px) = 18px
  '3xl': 22,  // calc(var(--radius) + 12px) = 22px
  '4xl': 26,  // calc(var(--radius) + 16px) = 26px
  full: 9999,
} as const

// =============================================================================
// Theme Interface
// =============================================================================

export interface ThemeColors {
  // Base colors
  background: string
  foreground: string
  card: string
  cardForeground: string
  muted: string
  mutedForeground: string
  border: string
  input: string
  ring: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  // Accent (always violet)
  accent: string
  accentLight: string
  accentDark: string
  // Semantic
  success: string
  warning: string
  error: string
  info: string
  // Neutrals
  white: string
  black: string
}

export interface Theme {
  isDark: boolean
  colors: ThemeColors
  typography: typeof typography
  spacing: typeof spacing
  radius: typeof radius
}

// =============================================================================
// useTheme Hook
// =============================================================================

/**
 * Main theme hook - uses ThemeProvider context when available,
 * falls back to system color scheme when not
 */
export function useTheme(): Theme {
  // Try to use context first (from ThemeProvider)
  try {
    // Use dynamic import to avoid circular dependency
    const { useThemeWithProvider } = require('./ThemeProvider')
    return useThemeWithProvider()
  } catch {
    // Fallback to system color scheme
    const colorScheme = useColorScheme()
    const isDark = colorScheme === 'dark'
    const themeColors = isDark ? colors.dark : colors.light

    return {
      isDark,
      colors: {
        ...themeColors,
        accent: colors.accent,
        accentLight: colors.accentLight,
        accentDark: colors.accentDark,
        success: colors.success,
        warning: colors.warning,
        error: colors.error,
        info: colors.info,
        white: colors.white,
        black: colors.black,
      },
      typography,
      spacing,
      radius,
    }
  }
}

// =============================================================================
// Shadow Presets
// =============================================================================

/**
 * Standard card shadow
 */
export const cardShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 8,
  elevation: 3,
}

/**
 * Elevated card shadow (for hover states, modals)
 */
export const cardShadowLarge = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.12,
  shadowRadius: 12,
  elevation: 6,
}

/**
 * Primary accent shadow (for CTAs, highlighted cards)
 */
export const accentShadow = {
  shadowColor: colors.accent,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 12,
  elevation: 8,
}

// Backwards compatibility alias
export const primaryCardShadow = accentShadow

// =============================================================================
// Animation Presets (for react-native-reanimated)
// =============================================================================

export const animation = {
  // Duration in ms
  duration: {
    fast: 150,
    normal: 200,
    slow: 300,
    verySlow: 400,
  },

  // Stagger delays
  stagger: {
    fast: 50,
    normal: 80,
    slow: 100,
  },

  // Spring config
  spring: {
    gentle: { damping: 15, stiffness: 100 },
    bouncy: { damping: 10, stiffness: 150 },
    stiff: { damping: 20, stiffness: 200 },
  },
} as const

// =============================================================================
// Touch Target Sizes (for accessibility, min 44px)
// =============================================================================

export const touchTarget = {
  sm: 36,
  md: 44,
  lg: 48,
  xl: 56,
} as const
