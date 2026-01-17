import type { SupabaseClient } from '@supabase/supabase-js'
import type { Habit, HabitCompletion, HabitFrequency, HabitTracking } from '../types'

// Database row types
interface DbHabit {
  id: string
  user_id: string
  area_id: string | null
  project_id: string | null
  title: string
  description: string | null
  frequency_type: 'daily' | 'weekly' | 'specificDays' | 'monthly'
  frequency_data: Record<string, unknown>
  tracking_type: 'boolean' | 'quantitative'
  tracking_target: number | null
  tracking_unit: string | null
  color: string
  icon: string | null
  order: number
  created_at: string
  archived_at: string | null
  reminder_time: string | null
  reminder_enabled: boolean
  notebook_id: string | null
}

interface DbHabitCompletion {
  id: string
  habit_id: string
  user_id: string
  date: string
  value: number
  completed_at: string
}

interface DbHabitStreak {
  id: string
  user_id: string
  habit_id: string
  current_streak: number
  longest_streak: number
  last_completed_date: string | null
}

// Transform database row to frontend type
function toHabit(row: DbHabit, completions: HabitCompletion[] = []): Habit {
  // Build frequency object
  let frequency: HabitFrequency
  switch (row.frequency_type) {
    case 'daily':
      frequency = { type: 'daily' }
      break
    case 'weekly':
      frequency = {
        type: 'weekly',
        daysPerWeek: (row.frequency_data?.daysPerWeek as number) ?? 7,
      }
      break
    case 'specificDays':
      frequency = {
        type: 'specificDays',
        days: (row.frequency_data?.days as number[]) ?? [],
      }
      break
    case 'monthly':
      frequency = {
        type: 'monthly',
        timesPerMonth: (row.frequency_data?.timesPerMonth as number) ?? 1,
      }
      break
  }

  // Build tracking object
  let tracking: HabitTracking
  if (row.tracking_type === 'quantitative') {
    tracking = {
      type: 'quantitative',
      target: row.tracking_target ?? 1,
      unit: row.tracking_unit ?? '',
    }
  } else {
    tracking = { type: 'boolean' }
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    areaId: row.area_id ?? '',
    projectId: row.project_id ?? undefined,
    frequency,
    tracking,
    color: row.color,
    icon: row.icon ?? undefined,
    completions,
    createdAt: row.created_at,
    archivedAt: row.archived_at ?? undefined,
    reminderTime: row.reminder_time ?? undefined,
    reminderEnabled: row.reminder_enabled ?? false,
    notebookId: row.notebook_id ?? undefined,
  }
}

function toCompletion(row: DbHabitCompletion): HabitCompletion {
  return {
    date: row.date,
    value: row.value,
    completedAt: row.completed_at,
  }
}

export const habitsService = {
  async getAll(supabase: SupabaseClient): Promise<Habit[]> {
    // Get habits
    const { data: habitsData, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .order('order', { ascending: true })

    if (habitsError) throw habitsError

    const habits = (habitsData ?? []) as DbHabit[]

    if (habits.length === 0) return []

    // Get completions for all habits (last 90 days for performance)
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
    const startDate = ninetyDaysAgo.toISOString().split('T')[0]

    const { data: completionsData, error: completionsError } = await supabase
      .from('habit_completions')
      .select('*')
      .gte('date', startDate)

    if (completionsError) throw completionsError

    const completions = (completionsData ?? []) as DbHabitCompletion[]

    // Group completions by habit
    const completionsByHabit = new Map<string, HabitCompletion[]>()
    completions.forEach((c) => {
      const existing = completionsByHabit.get(c.habit_id) ?? []
      existing.push(toCompletion(c))
      completionsByHabit.set(c.habit_id, existing)
    })

    return habits.map((h) => toHabit(h, completionsByHabit.get(h.id) ?? []))
  },

  async getById(supabase: SupabaseClient, id: string): Promise<Habit | null> {
    const { data: habitData, error: habitError } = await supabase
      .from('habits')
      .select('*')
      .eq('id', id)
      .single()

    if (habitError) {
      if (habitError.code === 'PGRST116') return null
      throw habitError
    }

    // Get completions for this habit
    const { data: completionsData, error: completionsError } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('habit_id', id)

    if (completionsError) throw completionsError

    const completions = ((completionsData ?? []) as DbHabitCompletion[]).map(toCompletion)

    return toHabit(habitData as DbHabit, completions)
  },

  async getByArea(supabase: SupabaseClient, areaId: string): Promise<Habit[]> {
    const { data: habitsData, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('area_id', areaId)
      .is('archived_at', null)
      .order('order', { ascending: true })

    if (habitsError) throw habitsError

    const habits = (habitsData ?? []) as DbHabit[]

    if (habits.length === 0) return []

    // Get completions
    const habitIds = habits.map((h) => h.id)
    const { data: completionsData, error: completionsError } = await supabase
      .from('habit_completions')
      .select('*')
      .in('habit_id', habitIds)

    if (completionsError) throw completionsError

    const completions = (completionsData ?? []) as DbHabitCompletion[]
    const completionsByHabit = new Map<string, HabitCompletion[]>()
    completions.forEach((c) => {
      const existing = completionsByHabit.get(c.habit_id) ?? []
      existing.push(toCompletion(c))
      completionsByHabit.set(c.habit_id, existing)
    })

    return habits.map((h) => toHabit(h, completionsByHabit.get(h.id) ?? []))
  },

  async getByNotebook(supabase: SupabaseClient, notebookId: string): Promise<Habit[]> {
    const { data: habitsData, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('notebook_id', notebookId)
      .is('archived_at', null)
      .order('order', { ascending: true })

    if (habitsError) throw habitsError

    const habits = (habitsData ?? []) as DbHabit[]

    if (habits.length === 0) return []

    // Get completions
    const habitIds = habits.map((h) => h.id)
    const { data: completionsData, error: completionsError } = await supabase
      .from('habit_completions')
      .select('*')
      .in('habit_id', habitIds)

    if (completionsError) throw completionsError

    const completions = (completionsData ?? []) as DbHabitCompletion[]
    const completionsByHabit = new Map<string, HabitCompletion[]>()
    completions.forEach((c) => {
      const existing = completionsByHabit.get(c.habit_id) ?? []
      existing.push(toCompletion(c))
      completionsByHabit.set(c.habit_id, existing)
    })

    return habits.map((h) => toHabit(h, completionsByHabit.get(h.id) ?? []))
  },

  async getByProject(supabase: SupabaseClient, projectId: string): Promise<Habit[]> {
    const { data: habitsData, error: habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('project_id', projectId)
      .is('archived_at', null)
      .order('order', { ascending: true })

    if (habitsError) throw habitsError

    const habits = (habitsData ?? []) as DbHabit[]

    if (habits.length === 0) return []

    // Get completions
    const habitIds = habits.map((h) => h.id)
    const { data: completionsData, error: completionsError } = await supabase
      .from('habit_completions')
      .select('*')
      .in('habit_id', habitIds)

    if (completionsError) throw completionsError

    const completions = (completionsData ?? []) as DbHabitCompletion[]
    const completionsByHabit = new Map<string, HabitCompletion[]>()
    completions.forEach((c) => {
      const existing = completionsByHabit.get(c.habit_id) ?? []
      existing.push(toCompletion(c))
      completionsByHabit.set(c.habit_id, existing)
    })

    return habits.map((h) => toHabit(h, completionsByHabit.get(h.id) ?? []))
  },

  async create(
    supabase: SupabaseClient,
    habit: Omit<Habit, 'id' | 'createdAt' | 'completions'>
  ): Promise<Habit> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get max order
    const { data: allHabits } = await supabase
      .from('habits')
      .select('*')
      .order('order', { ascending: false })
      .limit(1)

    const maxOrder = allHabits && allHabits.length > 0 ? (allHabits[0] as DbHabit).order : -1

    // Build frequency data
    let frequencyData: Record<string, unknown> = {}
    if (habit.frequency.type === 'weekly') {
      frequencyData = { daysPerWeek: habit.frequency.daysPerWeek }
    } else if (habit.frequency.type === 'specificDays') {
      frequencyData = { days: habit.frequency.days }
    } else if (habit.frequency.type === 'monthly') {
      frequencyData = { timesPerMonth: habit.frequency.timesPerMonth }
    }

    const { data, error } = await supabase
      .from('habits')
      .insert({
        user_id: user.id,
        area_id: habit.areaId || null,
        project_id: habit.projectId || null,
        title: habit.title,
        description: habit.description,
        frequency_type: habit.frequency.type,
        frequency_data: frequencyData,
        tracking_type: habit.tracking.type,
        tracking_target: habit.tracking.type === 'quantitative' ? habit.tracking.target : null,
        tracking_unit: habit.tracking.type === 'quantitative' ? habit.tracking.unit : null,
        color: habit.color,
        icon: habit.icon,
        order: maxOrder + 1,
        reminder_time: habit.reminderTime || null,
        reminder_enabled: habit.reminderEnabled || false,
        notebook_id: habit.notebookId || null,
      })
      .select()
      .single()

    if (error) throw error

    // Create streak record
    await supabase.from('habit_streaks').insert({
      user_id: user.id,
      habit_id: data.id,
      current_streak: 0,
      longest_streak: 0,
    })

    return toHabit(data as DbHabit, [])
  },

  async update(
    supabase: SupabaseClient,
    id: string,
    updates: Partial<Omit<Habit, 'id' | 'createdAt' | 'completions'>>
  ): Promise<Habit> {
    const dbUpdates: Record<string, unknown> = {}

    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.areaId !== undefined) dbUpdates.area_id = updates.areaId || null
    if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId || null
    if (updates.color !== undefined) dbUpdates.color = updates.color
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon
    if (updates.archivedAt !== undefined) dbUpdates.archived_at = updates.archivedAt
    if (updates.reminderTime !== undefined) dbUpdates.reminder_time = updates.reminderTime || null
    if (updates.reminderEnabled !== undefined) dbUpdates.reminder_enabled = updates.reminderEnabled
    if (updates.notebookId !== undefined) dbUpdates.notebook_id = updates.notebookId || null

    if (updates.frequency) {
      dbUpdates.frequency_type = updates.frequency.type
      let frequencyData: Record<string, unknown> = {}
      if (updates.frequency.type === 'weekly') {
        frequencyData = { daysPerWeek: updates.frequency.daysPerWeek }
      } else if (updates.frequency.type === 'specificDays') {
        frequencyData = { days: updates.frequency.days }
      } else if (updates.frequency.type === 'monthly') {
        frequencyData = { timesPerMonth: updates.frequency.timesPerMonth }
      }
      dbUpdates.frequency_data = frequencyData
    }

    if (updates.tracking) {
      dbUpdates.tracking_type = updates.tracking.type
      if (updates.tracking.type === 'quantitative') {
        dbUpdates.tracking_target = updates.tracking.target
        dbUpdates.tracking_unit = updates.tracking.unit
      } else {
        dbUpdates.tracking_target = null
        dbUpdates.tracking_unit = null
      }
    }

    const { data, error } = await supabase
      .from('habits')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Get completions
    const { data: completionsData } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('habit_id', id)

    const completions = ((completionsData ?? []) as DbHabitCompletion[]).map(toCompletion)

    return toHabit(data as DbHabit, completions)
  },

  async delete(supabase: SupabaseClient, id: string): Promise<void> {
    const { error } = await supabase.from('habits').delete().eq('id', id)
    if (error) throw error
  },

  async archive(supabase: SupabaseClient, id: string): Promise<Habit> {
    return this.update(supabase, id, { archivedAt: new Date().toISOString() })
  },

  async unarchive(supabase: SupabaseClient, id: string): Promise<Habit> {
    const { data, error } = await supabase
      .from('habits')
      .update({ archived_at: null })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    const { data: completionsData } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('habit_id', id)

    const completions = ((completionsData ?? []) as DbHabitCompletion[]).map(toCompletion)

    return toHabit(data as DbHabit, completions)
  },

  async reorder(supabase: SupabaseClient, orderedIds: string[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await supabase
        .from('habits')
        .update({ order: i })
        .eq('id', orderedIds[i])

      if (error) throw error
    }
  },
}

// Completions service
export const completionsService = {
  async toggle(
    supabase: SupabaseClient,
    habitId: string,
    date: string,
    value: number = 1
  ): Promise<{ added: boolean; completion?: HabitCompletion }> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Check if completion exists
    const { data: existing } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('habit_id', habitId)
      .eq('date', date)
      .single()

    if (existing) {
      // Remove completion
      const { error } = await supabase
        .from('habit_completions')
        .delete()
        .eq('id', existing.id)

      if (error) throw error

      // Update streak
      await this.updateStreak(supabase, habitId)

      return { added: false }
    }

    // Add completion
    const { data, error } = await supabase
      .from('habit_completions')
      .insert({
        habit_id: habitId,
        user_id: user.id,
        date,
        value,
      })
      .select()
      .single()

    if (error) throw error

    // Update streak
    await this.updateStreak(supabase, habitId)

    return {
      added: true,
      completion: toCompletion(data as DbHabitCompletion),
    }
  },

  async updateStreak(supabase: SupabaseClient, habitId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get completions ordered by date
    const { data: completions } = await supabase
      .from('habit_completions')
      .select('date')
      .eq('habit_id', habitId)
      .order('date', { ascending: false })

    if (!completions || completions.length === 0) {
      // Reset streak
      await supabase
        .from('habit_streaks')
        .upsert({
          user_id: user.id,
          habit_id: habitId,
          current_streak: 0,
          longest_streak: 0,
          last_completed_date: null,
        })
      // Update global stats
      await this.updateGlobalStreaks(supabase, user.id)
      return
    }

    // Calculate streak
    const dates = completions.map((c) => c.date as string)
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    let currentStreak = 0
    const checkDate = dates[0] === today ? today : dates[0] === yesterday ? yesterday : null

    if (checkDate) {
      currentStreak = 1
      let prevDate = new Date(checkDate)

      for (let i = 1; i < dates.length; i++) {
        const expectedPrev = new Date(prevDate)
        expectedPrev.setDate(expectedPrev.getDate() - 1)
        const expectedPrevStr = expectedPrev.toISOString().split('T')[0]

        if (dates[i] === expectedPrevStr) {
          currentStreak++
          prevDate = expectedPrev
        } else {
          break
        }
      }
    }

    // Get current longest streak
    const { data: streakData } = await supabase
      .from('habit_streaks')
      .select('longest_streak')
      .eq('habit_id', habitId)
      .single()

    const longestStreak = Math.max(currentStreak, (streakData as DbHabitStreak | null)?.longest_streak ?? 0)

    await supabase.from('habit_streaks').upsert({
      user_id: user.id,
      habit_id: habitId,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_completed_date: dates[0],
    })

    // Update global stats
    await this.updateGlobalStreaks(supabase, user.id)
  },

  async updateGlobalStreaks(supabase: SupabaseClient, userId: string): Promise<void> {
    // Get all streaks for user
    const { data: allStreaks } = await supabase
      .from('habit_streaks')
      .select('current_streak, longest_streak')
      .eq('user_id', userId)

    const maxCurrentStreak = Math.max(...(allStreaks?.map((s) => s.current_streak) ?? [0]), 0)
    const maxLongestStreak = Math.max(...(allStreaks?.map((s) => s.longest_streak) ?? [0]), 0)

    // Get current stats to preserve other fields
    const { data: current } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Use upsert to create row if it doesn't exist
    await supabase
      .from('user_stats')
      .upsert({
        user_id: userId,
        total_xp: current?.total_xp ?? 0,
        level: current?.level ?? 1,
        habits_completed: current?.habits_completed ?? 0,
        tasks_completed: current?.tasks_completed ?? 0,
        current_streak: maxCurrentStreak,
        longest_streak: maxLongestStreak,
      })
  },

  async getStreaks(supabase: SupabaseClient): Promise<Map<string, { current: number; longest: number }>> {
    const { data } = await supabase.from('habit_streaks').select('*')

    const streaks = new Map<string, { current: number; longest: number }>()

    if (data) {
      (data as DbHabitStreak[]).forEach((s) => {
        streaks.set(s.habit_id, {
          current: s.current_streak,
          longest: s.longest_streak,
        })
      })
    }

    return streaks
  },

  async setCompletionValue(
    supabase: SupabaseClient,
    habitId: string,
    date: string,
    value: number
  ): Promise<{ completion: HabitCompletion }> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Check if completion exists
    const { data: existing } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('habit_id', habitId)
      .eq('date', date)
      .single()

    if (existing) {
      // Update existing completion
      const { data, error } = await supabase
        .from('habit_completions')
        .update({ value })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error

      // Update streak
      await this.updateStreak(supabase, habitId)

      return { completion: toCompletion(data as DbHabitCompletion) }
    }

    // Create new completion
    const { data, error } = await supabase
      .from('habit_completions')
      .insert({
        habit_id: habitId,
        user_id: user.id,
        date,
        value,
      })
      .select()
      .single()

    if (error) throw error

    // Update streak
    await this.updateStreak(supabase, habitId)

    return { completion: toCompletion(data as DbHabitCompletion) }
  },

  async removeCompletion(
    supabase: SupabaseClient,
    habitId: string,
    date: string
  ): Promise<void> {
    const { error } = await supabase
      .from('habit_completions')
      .delete()
      .eq('habit_id', habitId)
      .eq('date', date)

    if (error) throw error

    // Update streak
    await this.updateStreak(supabase, habitId)
  },
}
