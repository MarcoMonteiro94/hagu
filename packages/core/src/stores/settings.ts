import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme, Locale, UserSettings, HomeWidget, HomeWidgetType } from '../types'
import { DEFAULT_HOME_WIDGETS } from '../types'

interface SettingsState extends UserSettings {
  setTheme: (theme: Theme) => void
  setLocale: (locale: Locale) => void
  setWeekStartsOn: (day: 0 | 1) => void
  setNotificationsEnabled: (enabled: boolean) => void
  setUserName: (name: string) => void
  completeOnboarding: () => void
  setWidgetVisibility: (widgetId: HomeWidgetType, visible: boolean) => void
  reorderWidgets: (widgets: HomeWidget[]) => void
  getVisibleWidgets: () => HomeWidget[]
  toggleHideBalances: () => void
  reset: () => void
}

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  locale: 'pt-BR',
  weekStartsOn: 0,
  notificationsEnabled: true,
  onboardingCompleted: false,
  userName: undefined,
  homeWidgets: DEFAULT_HOME_WIDGETS,
  hideBalances: false,
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,

      setTheme: (theme) => set({ theme }),

      setLocale: (locale) => set({ locale }),

      setWeekStartsOn: (weekStartsOn) => set({ weekStartsOn }),

      setNotificationsEnabled: (notificationsEnabled) =>
        set({ notificationsEnabled }),

      setUserName: (userName) => set({ userName }),

      completeOnboarding: () => set({ onboardingCompleted: true }),

      setWidgetVisibility: (widgetId, visible) =>
        set((state) => ({
          homeWidgets: (state.homeWidgets ?? DEFAULT_HOME_WIDGETS).map((w) =>
            w.id === widgetId ? { ...w, visible } : w
          ),
        })),

      reorderWidgets: (widgets) => set({ homeWidgets: widgets }),

      getVisibleWidgets: () => {
        const widgets = get().homeWidgets ?? DEFAULT_HOME_WIDGETS
        return widgets.filter((w) => w.visible).sort((a, b) => a.order - b.order)
      },

      toggleHideBalances: () => set((state) => ({ hideBalances: !state.hideBalances })),

      reset: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'hagu-settings',
    }
  )
)
