'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import {
  userStatsService,
  achievementsService,
  habitStreaksService,
  getXpForLevel,
  getXpForNextLevel,
  getXpProgress,
} from '@/services/gamification.service'
import type { UserStats, Achievement, StreakData } from '@/types'

// Query keys
export const gamificationKeys = {
  all: ['gamification'] as const,
  stats: () => [...gamificationKeys.all, 'stats'] as const,
  achievements: () => [...gamificationKeys.all, 'achievements'] as const,
  streaks: () => [...gamificationKeys.all, 'streaks'] as const,
  streak: (habitId: string) => [...gamificationKeys.streaks(), habitId] as const,
}

// User Stats Hooks

export function useUserStats() {
  const supabase = createClient()

  return useQuery({
    queryKey: gamificationKeys.stats(),
    queryFn: () => userStatsService.get(supabase),
  })
}

export function useAddXp() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (amount: number) => userStatsService.addXp(supabase, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gamificationKeys.stats() })
    },
  })
}

export function useIncrementHabitsCompleted() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => userStatsService.incrementHabitsCompleted(supabase),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: gamificationKeys.stats() })

      const previousStats = queryClient.getQueryData<UserStats>(gamificationKeys.stats())

      if (previousStats) {
        queryClient.setQueryData(gamificationKeys.stats(), {
          ...previousStats,
          habitsCompleted: previousStats.habitsCompleted + 1,
          totalXp: previousStats.totalXp + 10,
        })
      }

      return { previousStats }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousStats) {
        queryClient.setQueryData(gamificationKeys.stats(), context.previousStats)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: gamificationKeys.stats() })
    },
  })
}

export function useIncrementTasksCompleted() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => userStatsService.incrementTasksCompleted(supabase),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: gamificationKeys.stats() })

      const previousStats = queryClient.getQueryData<UserStats>(gamificationKeys.stats())

      if (previousStats) {
        queryClient.setQueryData(gamificationKeys.stats(), {
          ...previousStats,
          tasksCompleted: previousStats.tasksCompleted + 1,
          totalXp: previousStats.totalXp + 15,
        })
      }

      return { previousStats }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousStats) {
        queryClient.setQueryData(gamificationKeys.stats(), context.previousStats)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: gamificationKeys.stats() })
    },
  })
}

// Achievements Hooks

export function useAchievements() {
  const supabase = createClient()

  return useQuery({
    queryKey: gamificationKeys.achievements(),
    queryFn: () => achievementsService.getAll(supabase),
  })
}

export function useUnlockAchievement() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ type, data }: { type: string; data?: Record<string, unknown> }) =>
      achievementsService.unlock(supabase, type, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gamificationKeys.achievements() })
      queryClient.invalidateQueries({ queryKey: gamificationKeys.stats() })
    },
  })
}

export function useHasAchievement(type: string) {
  const { data: achievements } = useAchievements()
  return achievements?.some((a) => a.type === type) ?? false
}

// Streaks Hooks (use hooks from use-habits.ts for habit-specific streaks)

export function useUpdateGamificationStreak() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ habitId, date }: { habitId: string; date: string }) =>
      habitStreaksService.updateStreak(supabase, habitId, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gamificationKeys.streaks() })
      queryClient.invalidateQueries({ queryKey: gamificationKeys.stats() })
    },
  })
}

// Derived/Computed Hooks

export function useLevel() {
  const { data: stats } = useUserStats()
  return stats?.level ?? 1
}

export function useXpProgress() {
  const { data: stats } = useUserStats()
  if (!stats) return { current: 0, required: 100, percentage: 0 }

  const currentLevelXp = getXpForLevel(stats.level)
  const nextLevelXp = getXpForNextLevel(stats.level)
  const current = stats.totalXp - currentLevelXp
  const required = nextLevelXp - currentLevelXp

  return {
    current,
    required,
    percentage: getXpProgress(stats.totalXp, stats.level),
  }
}

export function useGlobalStreak() {
  const { data: stats } = useUserStats()
  return {
    current: stats?.currentStreak ?? 0,
    longest: stats?.longestStreak ?? 0,
  }
}

// Helper to get unlocked achievement count
export function useUnlockedAchievementsCount() {
  const { data: achievements } = useAchievements()
  return achievements?.length ?? 0
}
