import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Achievement, StreakData, UserStats } from '@/types'

interface GamificationState extends UserStats {
  achievements: Achievement[]
  streaks: StreakData[]

  // XP and Level actions
  addXp: (amount: number) => void
  incrementHabitsCompleted: () => void
  incrementTasksCompleted: () => void

  // Streak actions
  updateStreak: (habitId: string, date: string) => void
  getStreakForHabit: (habitId: string) => StreakData | undefined

  // Achievement actions
  unlockAchievement: (type: string, data?: Record<string, unknown>) => void
  hasAchievement: (type: string) => boolean

  // Queries
  getLevel: () => number
  getXpForNextLevel: () => number
  getXpProgress: () => number
}

// XP required for each level (cumulative)
const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 850, 1300, 1850, 2500, 3250, 4100,
  5050, 6100, 7250, 8500, 9850, 11300, 12850, 14500, 16250, 18100,
]

function calculateLevel(totalXp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) {
      return i + 1
    }
  }
  return 1
}

function getXpForLevel(level: number): number {
  return LEVEL_THRESHOLDS[level - 1] || 0
}

function getXpForNextLevel(level: number): number {
  return LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
}

const DEFAULT_STATS: UserStats = {
  totalXp: 0,
  level: 1,
  habitsCompleted: 0,
  tasksCompleted: 0,
  currentStreak: 0,
  longestStreak: 0,
}

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATS,
      achievements: [],
      streaks: [],

      addXp: (amount) => {
        set((state) => {
          const newTotalXp = state.totalXp + amount
          const newLevel = calculateLevel(newTotalXp)
          return {
            totalXp: newTotalXp,
            level: newLevel,
          }
        })
      },

      incrementHabitsCompleted: () => {
        set((state) => ({
          habitsCompleted: state.habitsCompleted + 1,
        }))
        // Award XP for completing a habit
        get().addXp(10)
      },

      incrementTasksCompleted: () => {
        set((state) => ({
          tasksCompleted: state.tasksCompleted + 1,
        }))
        // Award XP for completing a task
        get().addXp(15)
      },

      updateStreak: (habitId, date) => {
        set((state) => {
          const existingIndex = state.streaks.findIndex((s) => s.habitId === habitId)
          const existing = existingIndex >= 0 ? state.streaks[existingIndex] : null

          // Parse dates
          const completionDate = new Date(date)
          const lastDate = existing?.lastCompletedDate
            ? new Date(existing.lastCompletedDate)
            : null

          let newStreak = 1
          if (lastDate) {
            const diffDays = Math.floor(
              (completionDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
            )

            if (diffDays === 1) {
              // Consecutive day
              newStreak = (existing?.currentStreak || 0) + 1
            } else if (diffDays === 0) {
              // Same day
              newStreak = existing?.currentStreak || 1
            }
            // If diffDays > 1, streak breaks (newStreak stays 1)
          }

          const longestStreak = Math.max(newStreak, existing?.longestStreak || 0)

          const newStreakData: StreakData = {
            habitId,
            currentStreak: newStreak,
            longestStreak,
            lastCompletedDate: date,
          }

          const newStreaks =
            existingIndex >= 0
              ? state.streaks.map((s, i) => (i === existingIndex ? newStreakData : s))
              : [...state.streaks, newStreakData]

          // Update global streak stats
          const maxCurrentStreak = Math.max(...newStreaks.map((s) => s.currentStreak))
          const maxLongestStreak = Math.max(...newStreaks.map((s) => s.longestStreak))

          return {
            streaks: newStreaks,
            currentStreak: maxCurrentStreak,
            longestStreak: maxLongestStreak,
          }
        })
      },

      getStreakForHabit: (habitId) => {
        return get().streaks.find((s) => s.habitId === habitId)
      },

      unlockAchievement: (type, data) => {
        if (get().hasAchievement(type)) return

        const achievement: Achievement = {
          id: crypto.randomUUID(),
          type,
          unlockedAt: new Date().toISOString(),
          data,
        }

        set((state) => ({
          achievements: [...state.achievements, achievement],
        }))

        // Award XP for achievement
        get().addXp(50)
      },

      hasAchievement: (type) => {
        return get().achievements.some((a) => a.type === type)
      },

      getLevel: () => get().level,

      getXpForNextLevel: () => {
        const level = get().level
        return getXpForNextLevel(level)
      },

      getXpProgress: () => {
        const { totalXp, level } = get()
        const currentLevelXp = getXpForLevel(level)
        const nextLevelXp = getXpForNextLevel(level)
        const progress = totalXp - currentLevelXp
        const required = nextLevelXp - currentLevelXp
        return Math.round((progress / required) * 100)
      },
    }),
    {
      name: 'hagu-gamification',
    }
  )
)

// Achievement type constants
export const ACHIEVEMENT_TYPES = {
  FIRST_HABIT: 'first_habit',
  FIRST_TASK: 'first_task',
  STREAK_7: 'streak_7',
  STREAK_30: 'streak_30',
  STREAK_100: 'streak_100',
  HABITS_10: 'habits_10',
  HABITS_50: 'habits_50',
  HABITS_100: 'habits_100',
  TASKS_10: 'tasks_10',
  TASKS_50: 'tasks_50',
  TASKS_100: 'tasks_100',
  LEVEL_5: 'level_5',
  LEVEL_10: 'level_10',
  LEVEL_20: 'level_20',
} as const
