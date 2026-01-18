import React, { createContext, useContext, useMemo, useEffect, useState } from 'react'
import { useColorScheme as useSystemColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { colors } from './colors'
import { typography, spacing, radius } from './index'

// =============================================================================
// Types
// =============================================================================

export type ThemeMode = 'light' | 'dark' | 'system'

export interface ThemeColors {
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
  accent: string
  accentLight: string
  accentDark: string
  success: string
  warning: string
  error: string
  info: string
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

interface ThemeContextValue extends Theme {
  themeMode: ThemeMode
  setThemeMode: (mode: ThemeMode) => void
}

// =============================================================================
// Context
// =============================================================================

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'theme-mode'

// =============================================================================
// Provider
// =============================================================================

interface ThemeProviderProps {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useSystemColorScheme()
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system')
  const [isLoaded, setIsLoaded] = useState(false)

  // Load saved theme mode on mount
  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY)
        if (saved && ['light', 'dark', 'system'].includes(saved)) {
          setThemeModeState(saved as ThemeMode)
        }
      } catch (error) {
        console.error('Failed to load theme mode:', error)
      } finally {
        setIsLoaded(true)
      }
    }
    loadThemeMode()
  }, [])

  // Set theme mode and persist
  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode)
    try {
      await AsyncStorage.setItem(STORAGE_KEY, mode)
    } catch (error) {
      console.error('Failed to save theme mode:', error)
    }
  }

  // Resolve actual theme based on mode
  const resolvedTheme = themeMode === 'system'
    ? (systemColorScheme || 'light')
    : themeMode

  const isDark = resolvedTheme === 'dark'

  const themeColors = useMemo<ThemeColors>(() => {
    const baseColors = isDark ? colors.dark : colors.light
    return {
      ...baseColors,
      accent: colors.accent,
      accentLight: colors.accentLight,
      accentDark: colors.accentDark,
      success: colors.success,
      warning: colors.warning,
      error: colors.error,
      info: colors.info,
      white: colors.white,
      black: colors.black,
    }
  }, [isDark])

  const value = useMemo<ThemeContextValue>(() => ({
    isDark,
    colors: themeColors,
    typography,
    spacing,
    radius,
    themeMode,
    setThemeMode,
  }), [isDark, themeColors, themeMode])

  // Don't render until theme is loaded to prevent flicker
  if (!isLoaded) {
    return null
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// =============================================================================
// Hook
// =============================================================================

export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider')
  }
  return context
}

/**
 * Backward-compatible useTheme that works with or without ThemeProvider
 */
export function useThemeWithProvider(): Theme {
  const context = useContext(ThemeContext)

  // If no provider, use system color scheme directly
  const systemColorScheme = useSystemColorScheme()
  const fallbackIsDark = systemColorScheme === 'dark'

  if (!context) {
    const themeColors = fallbackIsDark ? colors.dark : colors.light
    return {
      isDark: fallbackIsDark,
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

  return {
    isDark: context.isDark,
    colors: context.colors,
    typography: context.typography,
    spacing: context.spacing,
    radius: context.radius,
  }
}
