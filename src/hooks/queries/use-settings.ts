'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { settingsService, type FullUserSettings, type PomodoroSettings } from '@/services/settings.service'
import type { Theme, Locale } from '@/types'

// Query keys
export const settingsKeys = {
  all: ['settings'] as const,
  user: () => [...settingsKeys.all, 'user'] as const,
}

// Default settings for when user is not authenticated
const DEFAULT_SETTINGS: FullUserSettings = {
  theme: 'dark',
  locale: 'pt-BR',
  weekStartsOn: 0,
  notificationsEnabled: true,
  onboardingCompleted: false,
  userName: undefined,
  currency: undefined,
  pomodoroSettings: {
    focusDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsBeforeLongBreak: 4,
    autoStartBreaks: false,
    autoStartFocus: false,
  },
}

export function useSettings() {
  const supabase = createClient()

  return useQuery({
    queryKey: settingsKeys.user(),
    queryFn: async () => {
      const settings = await settingsService.get(supabase)
      return settings ?? DEFAULT_SETTINGS
    },
    staleTime: 1000 * 60 * 5, // Consider fresh for 5 minutes
  })
}

export function useUpdateSettings() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updates: Partial<FullUserSettings>) =>
      settingsService.update(supabase, updates),
    onMutate: async (updates) => {
      // Cancel outgoing fetches
      await queryClient.cancelQueries({ queryKey: settingsKeys.user() })

      // Snapshot previous value
      const previousSettings = queryClient.getQueryData<FullUserSettings>(settingsKeys.user())

      // Optimistically update
      if (previousSettings) {
        queryClient.setQueryData(settingsKeys.user(), {
          ...previousSettings,
          ...updates,
        })
      }

      return { previousSettings }
    },
    onError: (_err, _updates, context) => {
      // Rollback on error
      if (context?.previousSettings) {
        queryClient.setQueryData(settingsKeys.user(), context.previousSettings)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.user() })
    },
  })
}

export function useSetTheme() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (theme: Theme) => settingsService.setTheme(supabase, theme),
    onMutate: async (theme) => {
      await queryClient.cancelQueries({ queryKey: settingsKeys.user() })
      const previousSettings = queryClient.getQueryData<FullUserSettings>(settingsKeys.user())

      if (previousSettings) {
        queryClient.setQueryData(settingsKeys.user(), {
          ...previousSettings,
          theme,
        })
      }

      return { previousSettings }
    },
    onError: (_err, _theme, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(settingsKeys.user(), context.previousSettings)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.user() })
    },
  })
}

export function useSetLocale() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (locale: Locale) => settingsService.setLocale(supabase, locale),
    onMutate: async (locale) => {
      await queryClient.cancelQueries({ queryKey: settingsKeys.user() })
      const previousSettings = queryClient.getQueryData<FullUserSettings>(settingsKeys.user())

      if (previousSettings) {
        queryClient.setQueryData(settingsKeys.user(), {
          ...previousSettings,
          locale,
        })
      }

      return { previousSettings }
    },
    onError: (_err, _locale, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(settingsKeys.user(), context.previousSettings)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.user() })
    },
  })
}

export function useSetWeekStartsOn() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (day: 0 | 1) => settingsService.setWeekStartsOn(supabase, day),
    onMutate: async (day) => {
      await queryClient.cancelQueries({ queryKey: settingsKeys.user() })
      const previousSettings = queryClient.getQueryData<FullUserSettings>(settingsKeys.user())

      if (previousSettings) {
        queryClient.setQueryData(settingsKeys.user(), {
          ...previousSettings,
          weekStartsOn: day,
        })
      }

      return { previousSettings }
    },
    onError: (_err, _day, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(settingsKeys.user(), context.previousSettings)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.user() })
    },
  })
}

export function useSetNotificationsEnabled() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (enabled: boolean) =>
      settingsService.setNotificationsEnabled(supabase, enabled),
    onMutate: async (enabled) => {
      await queryClient.cancelQueries({ queryKey: settingsKeys.user() })
      const previousSettings = queryClient.getQueryData<FullUserSettings>(settingsKeys.user())

      if (previousSettings) {
        queryClient.setQueryData(settingsKeys.user(), {
          ...previousSettings,
          notificationsEnabled: enabled,
        })
      }

      return { previousSettings }
    },
    onError: (_err, _enabled, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(settingsKeys.user(), context.previousSettings)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.user() })
    },
  })
}

export function useSetUserName() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (name: string) => settingsService.setUserName(supabase, name),
    onMutate: async (name) => {
      await queryClient.cancelQueries({ queryKey: settingsKeys.user() })
      const previousSettings = queryClient.getQueryData<FullUserSettings>(settingsKeys.user())

      if (previousSettings) {
        queryClient.setQueryData(settingsKeys.user(), {
          ...previousSettings,
          userName: name,
        })
      }

      return { previousSettings }
    },
    onError: (_err, _name, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(settingsKeys.user(), context.previousSettings)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.user() })
    },
  })
}

export function useCompleteOnboarding() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => settingsService.completeOnboarding(supabase),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: settingsKeys.user() })
      const previousSettings = queryClient.getQueryData<FullUserSettings>(settingsKeys.user())

      if (previousSettings) {
        queryClient.setQueryData(settingsKeys.user(), {
          ...previousSettings,
          onboardingCompleted: true,
        })
      }

      return { previousSettings }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(settingsKeys.user(), context.previousSettings)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.user() })
    },
  })
}

export function useUpdatePomodoroSettings() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (settings: Partial<PomodoroSettings>) =>
      settingsService.updatePomodoroSettings(supabase, settings),
    onMutate: async (settings) => {
      await queryClient.cancelQueries({ queryKey: settingsKeys.user() })
      const previousSettings = queryClient.getQueryData<FullUserSettings>(settingsKeys.user())

      if (previousSettings) {
        queryClient.setQueryData(settingsKeys.user(), {
          ...previousSettings,
          pomodoroSettings: {
            ...previousSettings.pomodoroSettings,
            ...settings,
          },
        })
      }

      return { previousSettings }
    },
    onError: (_err, _settings, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(settingsKeys.user(), context.previousSettings)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.user() })
    },
  })
}
