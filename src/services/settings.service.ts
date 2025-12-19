import type { SupabaseClient } from '@supabase/supabase-js'
import type { UserSettings, Theme, Locale } from '@/types'

// Database row type (matching Supabase schema)
interface DbUserSettings {
  user_id: string
  theme: 'dark' | 'light' | 'system'
  locale: string
  week_starts_on: number
  notifications_enabled: boolean
  onboarding_completed: boolean
  user_name: string | null
  currency: string
  pomodoro_settings: PomodoroSettings | null
  updated_at: string
}

export interface PomodoroSettings {
  focusDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  sessionsBeforeLongBreak: number
  autoStartBreaks: boolean
  autoStartFocus: boolean
}

export interface FullUserSettings extends UserSettings {
  pomodoroSettings: PomodoroSettings
}

const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
}

// Transform database row to frontend type
function toFullUserSettings(row: DbUserSettings): FullUserSettings {
  return {
    theme: row.theme,
    locale: row.locale as Locale,
    weekStartsOn: row.week_starts_on as 0 | 1,
    notificationsEnabled: row.notifications_enabled,
    onboardingCompleted: row.onboarding_completed,
    userName: row.user_name ?? undefined,
    currency: row.currency as import('@/types/finances').CurrencyCode | undefined,
    pomodoroSettings: row.pomodoro_settings ?? DEFAULT_POMODORO_SETTINGS,
  }
}

export const settingsService = {
  async get(supabase: SupabaseClient): Promise<FullUserSettings | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return toFullUserSettings(data as DbUserSettings)
  },

  async update(
    supabase: SupabaseClient,
    updates: Partial<FullUserSettings>
  ): Promise<FullUserSettings> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const dbUpdates: Record<string, unknown> = {}

    if (updates.theme !== undefined) dbUpdates.theme = updates.theme
    if (updates.locale !== undefined) dbUpdates.locale = updates.locale
    if (updates.weekStartsOn !== undefined) dbUpdates.week_starts_on = updates.weekStartsOn
    if (updates.notificationsEnabled !== undefined) dbUpdates.notifications_enabled = updates.notificationsEnabled
    if (updates.onboardingCompleted !== undefined) dbUpdates.onboarding_completed = updates.onboardingCompleted
    if (updates.userName !== undefined) dbUpdates.user_name = updates.userName
    if (updates.currency !== undefined) dbUpdates.currency = updates.currency
    if (updates.pomodoroSettings !== undefined) dbUpdates.pomodoro_settings = updates.pomodoroSettings

    const { data, error } = await supabase
      .from('user_settings')
      .update(dbUpdates)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return toFullUserSettings(data as DbUserSettings)
  },

  async setTheme(supabase: SupabaseClient, theme: Theme): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('user_settings')
      .update({ theme })
      .eq('user_id', user.id)

    if (error) throw error
  },

  async setLocale(supabase: SupabaseClient, locale: Locale): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('user_settings')
      .update({ locale })
      .eq('user_id', user.id)

    if (error) throw error
  },

  async setWeekStartsOn(supabase: SupabaseClient, day: 0 | 1): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('user_settings')
      .update({ week_starts_on: day })
      .eq('user_id', user.id)

    if (error) throw error
  },

  async setNotificationsEnabled(supabase: SupabaseClient, enabled: boolean): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('user_settings')
      .update({ notifications_enabled: enabled })
      .eq('user_id', user.id)

    if (error) throw error
  },

  async setUserName(supabase: SupabaseClient, name: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('user_settings')
      .update({ user_name: name })
      .eq('user_id', user.id)

    if (error) throw error
  },

  async completeOnboarding(supabase: SupabaseClient): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { error } = await supabase
      .from('user_settings')
      .update({ onboarding_completed: true })
      .eq('user_id', user.id)

    if (error) throw error
  },

  async updatePomodoroSettings(
    supabase: SupabaseClient,
    settings: Partial<PomodoroSettings>
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get current settings first
    const current = await this.get(supabase)
    if (!current) throw new Error('Settings not found')

    const newPomodoroSettings = {
      ...current.pomodoroSettings,
      ...settings,
    }

    const { error } = await supabase
      .from('user_settings')
      .update({ pomodoro_settings: newPomodoroSettings })
      .eq('user_id', user.id)

    if (error) throw error
  },
}
