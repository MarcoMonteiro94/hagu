import { useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useColorScheme as useSystemColorScheme } from 'react-native'
import i18n from '@/i18n'

// =============================================================================
// Types
// =============================================================================

export type ThemeMode = 'light' | 'dark' | 'system'
export type LanguageCode = 'en-US' | 'pt-BR'

export interface AppSettings {
  themeMode: ThemeMode
  language: LanguageCode
  // Notification settings
  notificationsEnabled: boolean
  habitReminders: boolean
  taskReminders: boolean
  pomodoroNotifications: boolean
  reminderTime: string // HH:mm format
  // Home widget visibility
  homeWidgets: {
    quickStats: boolean
    habits: boolean
    tasks: boolean
    finances: boolean
    projects: boolean
  }
  homeWidgetOrder: string[]
}

// =============================================================================
// Constants
// =============================================================================

const STORAGE_KEY = 'app-settings'

const DEFAULT_SETTINGS: AppSettings = {
  themeMode: 'system',
  language: 'en-US',
  notificationsEnabled: true,
  habitReminders: true,
  taskReminders: true,
  pomodoroNotifications: true,
  reminderTime: '09:00',
  homeWidgets: {
    quickStats: true,
    habits: true,
    tasks: true,
    finances: true,
    projects: true,
  },
  homeWidgetOrder: [
    'quickStats',
    'habits',
    'tasks',
    'finances',
    'projects',
  ],
}

const QUERY_KEY = ['app-settings']

// =============================================================================
// Storage Helpers
// =============================================================================

async function loadSettings(): Promise<AppSettings> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY)
    if (data) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) }
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
  return DEFAULT_SETTINGS
}

async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

// =============================================================================
// Hooks
// =============================================================================

export function useAppSettings() {
  const queryClient = useQueryClient()

  const { data: settings = DEFAULT_SETTINGS, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: loadSettings,
    staleTime: Infinity,
  })

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<AppSettings>) => {
      const newSettings = { ...settings, ...updates }
      await saveSettings(newSettings)
      return newSettings
    },
    onSuccess: (newSettings) => {
      queryClient.setQueryData(QUERY_KEY, newSettings)
    },
  })

  const updateSettings = useCallback(
    (updates: Partial<AppSettings>) => {
      updateMutation.mutate(updates)
    },
    [updateMutation]
  )

  return {
    settings,
    isLoading,
    updateSettings,
  }
}

export function useThemeMode() {
  const { settings, updateSettings } = useAppSettings()
  const systemColorScheme = useSystemColorScheme()

  // Determine actual theme (resolving 'system' to actual value)
  const resolvedTheme = settings.themeMode === 'system'
    ? (systemColorScheme || 'light')
    : settings.themeMode

  const isDark = resolvedTheme === 'dark'

  const setThemeMode = useCallback(
    (mode: ThemeMode) => {
      updateSettings({ themeMode: mode })
    },
    [updateSettings]
  )

  return {
    themeMode: settings.themeMode,
    resolvedTheme,
    isDark,
    setThemeMode,
  }
}

export function useLanguage() {
  const { settings, updateSettings } = useAppSettings()

  const setLanguage = useCallback(
    (language: LanguageCode) => {
      updateSettings({ language })
      // Update i18n language
      i18n.changeLanguage(language)
    },
    [updateSettings]
  )

  return {
    language: settings.language,
    setLanguage,
  }
}

export function useNotificationSettings() {
  const { settings, updateSettings } = useAppSettings()

  const updateNotificationSettings = useCallback(
    (updates: Partial<Pick<AppSettings,
      'notificationsEnabled' | 'habitReminders' | 'taskReminders' | 'pomodoroNotifications' | 'reminderTime'
    >>) => {
      updateSettings(updates)
    },
    [updateSettings]
  )

  return {
    notificationsEnabled: settings.notificationsEnabled,
    habitReminders: settings.habitReminders,
    taskReminders: settings.taskReminders,
    pomodoroNotifications: settings.pomodoroNotifications,
    reminderTime: settings.reminderTime,
    updateNotificationSettings,
  }
}

export function useHomeWidgets() {
  const { settings, updateSettings } = useAppSettings()

  const toggleWidget = useCallback(
    (widgetKey: keyof AppSettings['homeWidgets']) => {
      updateSettings({
        homeWidgets: {
          ...settings.homeWidgets,
          [widgetKey]: !settings.homeWidgets[widgetKey],
        },
      })
    },
    [settings.homeWidgets, updateSettings]
  )

  const reorderWidgets = useCallback(
    (newOrder: string[]) => {
      updateSettings({ homeWidgetOrder: newOrder })
    },
    [updateSettings]
  )

  return {
    widgets: settings.homeWidgets,
    widgetOrder: settings.homeWidgetOrder,
    toggleWidget,
    reorderWidgets,
  }
}
