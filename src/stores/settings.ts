import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme, Locale, UserSettings } from '@/types'

interface SettingsState extends UserSettings {
  setTheme: (theme: Theme) => void
  setLocale: (locale: Locale) => void
  setWeekStartsOn: (day: 0 | 1) => void
  setNotificationsEnabled: (enabled: boolean) => void
  setUserName: (name: string) => void
  completeOnboarding: () => void
  reset: () => void
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  locale: 'pt-BR',
  weekStartsOn: 0,
  notificationsEnabled: true,
  onboardingCompleted: false,
  userName: undefined,
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setTheme: (theme) => set({ theme }),

      setLocale: (locale) => set({ locale }),

      setWeekStartsOn: (weekStartsOn) => set({ weekStartsOn }),

      setNotificationsEnabled: (notificationsEnabled) =>
        set({ notificationsEnabled }),

      setUserName: (userName) => set({ userName }),

      completeOnboarding: () => set({ onboardingCompleted: true }),

      reset: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'hagu-settings',
    }
  )
)
