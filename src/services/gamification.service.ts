import type { SupabaseClient } from '@supabase/supabase-js'
import type { Achievement, UserStats, StreakData } from '@/types'

// Database row types
interface DbUserStats {
  user_id: string
  total_xp: number
  level: number
  habits_completed: number
  tasks_completed: number
  current_streak: number
  longest_streak: number
  updated_at: string
}

interface DbAchievement {
  id: string
  user_id: string
  type: string
  data: Record<string, unknown> | null
  unlocked_at: string
}

interface DbHabitStreak {
  id: string
  user_id: string
  habit_id: string
  current_streak: number
  longest_streak: number
  last_completed_date: string | null
}

// XP required for each level (cumulative)
const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 850, 1300, 1850, 2500, 3250, 4100,
  5050, 6100, 7250, 8500, 9850, 11300, 12850, 14500, 16250, 18100,
]

// XP rewards
const XP_REWARDS = {
  HABIT_COMPLETION: 10,
  TASK_COMPLETION: 15,
  ACHIEVEMENT_UNLOCK: 50,
} as const

function calculateLevel(totalXp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) {
      return i + 1
    }
  }
  return 1
}

// Transform database row to frontend type
function toUserStats(row: DbUserStats): UserStats {
  return {
    totalXp: row.total_xp,
    level: row.level,
    habitsCompleted: row.habits_completed,
    tasksCompleted: row.tasks_completed,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
  }
}

function toAchievement(row: DbAchievement): Achievement {
  return {
    id: row.id,
    type: row.type,
    unlockedAt: row.unlocked_at,
    data: row.data ?? undefined,
  }
}

function toStreakData(row: DbHabitStreak): StreakData {
  return {
    habitId: row.habit_id,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    lastCompletedDate: row.last_completed_date ?? undefined,
  }
}

export const userStatsService = {
  async get(supabase: SupabaseClient): Promise<UserStats | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return toUserStats(data as DbUserStats)
  },

  async addXp(supabase: SupabaseClient, amount: number): Promise<UserStats> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get current stats
    const { data: current } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const currentStats = current as DbUserStats | null
    const newTotalXp = (currentStats?.total_xp ?? 0) + amount
    const newLevel = calculateLevel(newTotalXp)

    const { data, error } = await supabase
      .from('user_stats')
      .upsert({
        user_id: user.id,
        total_xp: newTotalXp,
        level: newLevel,
        habits_completed: currentStats?.habits_completed ?? 0,
        tasks_completed: currentStats?.tasks_completed ?? 0,
        current_streak: currentStats?.current_streak ?? 0,
        longest_streak: currentStats?.longest_streak ?? 0,
      })
      .select()
      .single()

    if (error) throw error

    return toUserStats(data as DbUserStats)
  },

  async incrementHabitsCompleted(supabase: SupabaseClient): Promise<UserStats> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get current stats
    const { data: current } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const currentStats = current as DbUserStats | null
    const newHabitsCompleted = (currentStats?.habits_completed ?? 0) + 1
    const newTotalXp = (currentStats?.total_xp ?? 0) + XP_REWARDS.HABIT_COMPLETION
    const newLevel = calculateLevel(newTotalXp)

    const { data, error } = await supabase
      .from('user_stats')
      .upsert({
        user_id: user.id,
        total_xp: newTotalXp,
        level: newLevel,
        habits_completed: newHabitsCompleted,
        tasks_completed: currentStats?.tasks_completed ?? 0,
        current_streak: currentStats?.current_streak ?? 0,
        longest_streak: currentStats?.longest_streak ?? 0,
      })
      .select()
      .single()

    if (error) throw error

    return toUserStats(data as DbUserStats)
  },

  async incrementTasksCompleted(supabase: SupabaseClient): Promise<UserStats> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get current stats
    const { data: current } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const currentStats = current as DbUserStats | null
    const newTasksCompleted = (currentStats?.tasks_completed ?? 0) + 1
    const newTotalXp = (currentStats?.total_xp ?? 0) + XP_REWARDS.TASK_COMPLETION
    const newLevel = calculateLevel(newTotalXp)

    const { data, error } = await supabase
      .from('user_stats')
      .upsert({
        user_id: user.id,
        total_xp: newTotalXp,
        level: newLevel,
        habits_completed: currentStats?.habits_completed ?? 0,
        tasks_completed: newTasksCompleted,
        current_streak: currentStats?.current_streak ?? 0,
        longest_streak: currentStats?.longest_streak ?? 0,
      })
      .select()
      .single()

    if (error) throw error

    return toUserStats(data as DbUserStats)
  },

  async updateStreaks(
    supabase: SupabaseClient,
    currentStreak: number,
    longestStreak: number
  ): Promise<UserStats> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get current stats to preserve other fields
    const { data: current } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const currentStats = current as DbUserStats | null

    // Use upsert to create row if it doesn't exist
    const { data, error } = await supabase
      .from('user_stats')
      .upsert({
        user_id: user.id,
        total_xp: currentStats?.total_xp ?? 0,
        level: currentStats?.level ?? 1,
        habits_completed: currentStats?.habits_completed ?? 0,
        tasks_completed: currentStats?.tasks_completed ?? 0,
        current_streak: currentStreak,
        longest_streak: longestStreak,
      })
      .select()
      .single()

    if (error) throw error

    return toUserStats(data as DbUserStats)
  },
}

export const achievementsService = {
  async getAll(supabase: SupabaseClient): Promise<Achievement[]> {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('unlocked_at', { ascending: false })

    if (error) throw error

    return ((data ?? []) as DbAchievement[]).map(toAchievement)
  },

  async unlock(
    supabase: SupabaseClient,
    type: string,
    data?: Record<string, unknown>
  ): Promise<Achievement | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Check if already unlocked
    const { data: existing } = await supabase
      .from('achievements')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', type)
      .single()

    if (existing) return null // Already unlocked

    // Unlock achievement
    const { data: achievement, error } = await supabase
      .from('achievements')
      .insert({
        user_id: user.id,
        type,
        data: data ?? null,
      })
      .select()
      .single()

    if (error) throw error

    // Award XP for achievement
    await userStatsService.addXp(supabase, XP_REWARDS.ACHIEVEMENT_UNLOCK)

    return toAchievement(achievement as DbAchievement)
  },

  async hasAchievement(supabase: SupabaseClient, type: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data } = await supabase
      .from('achievements')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', type)
      .single()

    return !!data
  },
}

export const habitStreaksService = {
  async getAll(supabase: SupabaseClient): Promise<StreakData[]> {
    const { data, error } = await supabase
      .from('habit_streaks')
      .select('*')

    if (error) throw error

    return ((data ?? []) as DbHabitStreak[]).map(toStreakData)
  },

  async getForHabit(supabase: SupabaseClient, habitId: string): Promise<StreakData | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('habit_streaks')
      .select('*')
      .eq('user_id', user.id)
      .eq('habit_id', habitId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return toStreakData(data as DbHabitStreak)
  },

  async updateStreak(
    supabase: SupabaseClient,
    habitId: string,
    date: string
  ): Promise<StreakData> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get existing streak
    const { data: existing } = await supabase
      .from('habit_streaks')
      .select('*')
      .eq('user_id', user.id)
      .eq('habit_id', habitId)
      .single()

    const existingStreak = existing as DbHabitStreak | null

    // Calculate new streak
    const completionDate = new Date(date)
    const lastDate = existingStreak?.last_completed_date
      ? new Date(existingStreak.last_completed_date)
      : null

    let newStreak = 1
    if (lastDate) {
      const diffDays = Math.floor(
        (completionDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (diffDays === 1) {
        // Consecutive day
        newStreak = (existingStreak?.current_streak || 0) + 1
      } else if (diffDays === 0) {
        // Same day
        newStreak = existingStreak?.current_streak || 1
      }
      // If diffDays > 1, streak breaks (newStreak stays 1)
    }

    const longestStreak = Math.max(newStreak, existingStreak?.longest_streak || 0)

    const { data, error } = await supabase
      .from('habit_streaks')
      .upsert({
        user_id: user.id,
        habit_id: habitId,
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_completed_date: date,
      })
      .select()
      .single()

    if (error) throw error

    // Update global streaks in user_stats
    const allStreaks = await this.getAll(supabase)
    const maxCurrentStreak = Math.max(...allStreaks.map((s) => s.currentStreak), 0)
    const maxLongestStreak = Math.max(...allStreaks.map((s) => s.longestStreak), 0)
    await userStatsService.updateStreaks(supabase, maxCurrentStreak, maxLongestStreak)

    return toStreakData(data as DbHabitStreak)
  },
}

// Achievement type constants
export const ACHIEVEMENT_TYPES = {
  FIRST_HABIT: 'first_habit',
  FIRST_TASK: 'first_task',
  STREAK_3: 'streak_3',
  STREAK_7: 'streak_7',
  STREAK_30: 'streak_30',
  STREAK_100: 'streak_100',
  HABITS_10: 'habits_10',
  HABITS_50: 'habits_50',
  HABITS_100: 'habits_100',
  HABITS_500: 'habits_500',
  TASKS_10: 'tasks_10',
  TASKS_50: 'tasks_50',
  TASKS_100: 'tasks_100',
  LEVEL_5: 'level_5',
  LEVEL_10: 'level_10',
  LEVEL_20: 'level_20',
  PERFECT_DAY: 'perfect_day',
  PERFECT_WEEK: 'perfect_week',
} as const

// XP utilities
export function getXpForLevel(level: number): number {
  return LEVEL_THRESHOLDS[level - 1] || 0
}

export function getXpForNextLevel(level: number): number {
  return LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
}

export function getXpProgress(totalXp: number, level: number): number {
  const currentLevelXp = getXpForLevel(level)
  const nextLevelXp = getXpForNextLevel(level)
  const progress = totalXp - currentLevelXp
  const required = nextLevelXp - currentLevelXp
  return required > 0 ? Math.round((progress / required) * 100) : 100
}
