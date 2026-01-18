'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import {
  useUserStats,
  useAchievements,
  useUnlockAchievement,
} from '@/hooks/queries/use-gamification'
import { useHabits } from '@/hooks/queries/use-habits'
import { useTasks } from '@/hooks/queries/use-tasks'
import { ACHIEVEMENT_DEFINITIONS, getAchievementDefinition } from '@/config/achievements'
import { showAchievementToast } from './achievement-toast'

export function AchievementProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations('achievements')
  const previousRef = useRef<{
    habitsCompleted: number
    tasksCompleted: number
    level: number
  } | null>(null)
  const isCheckingRef = useRef(false)

  const { data: stats, isLoading: isLoadingStats } = useUserStats()
  const { data: achievements = [], isLoading: isLoadingAchievements } = useAchievements()
  const unlockAchievementMutation = useUnlockAchievement()

  const habitsCompleted = stats?.habitsCompleted ?? 0
  const tasksCompleted = stats?.tasksCompleted ?? 0
  const currentStreak = stats?.currentStreak ?? 0
  const longestStreak = stats?.longestStreak ?? 0
  const level = stats?.level ?? 1

  const hasAchievement = useCallback(
    (type: string) => achievements.some((a) => a.type === type),
    [achievements]
  )

  const { data: habits = [], isLoading: isLoadingHabits } = useHabits()
  const { data: tasks = [] } = useTasks()

  // Don't check achievements until all data is loaded
  const isDataReady = !isLoadingStats && !isLoadingAchievements && !isLoadingHabits

  const checkAndUnlock = useCallback(async () => {
    // Prevent concurrent checks
    if (isCheckingRef.current) return []
    isCheckingRef.current = true

    try {
      const today = new Date().toISOString().split('T')[0]
      const activeHabits = habits.filter((h) => !h.archivedAt)
      const todayCompletedHabits = activeHabits.filter((h) =>
        h.completions.some((c) => c.date === today)
      ).length

      const newlyUnlocked: string[] = []

      for (const def of ACHIEVEMENT_DEFINITIONS) {
        if (hasAchievement(def.type)) continue

        let shouldUnlock = false

        switch (def.requirement.type) {
          case 'first_habit':
            shouldUnlock = habitsCompleted >= 1
            break

          case 'first_task':
            shouldUnlock = tasksCompleted >= 1
            break

          case 'habits_completed':
            shouldUnlock = habitsCompleted >= (def.requirement.value || 0)
            break

          case 'tasks_completed':
            shouldUnlock = tasksCompleted >= (def.requirement.value || 0)
            break

          case 'streak':
            shouldUnlock =
              currentStreak >= (def.requirement.value || 0) ||
              longestStreak >= (def.requirement.value || 0)
            break

          case 'level':
            shouldUnlock = level >= (def.requirement.value || 0)
            break

          case 'perfect_day':
            shouldUnlock =
              activeHabits.length > 0 && todayCompletedHabits >= activeHabits.length
            break

          case 'perfect_week':
            // Check if all habits were completed for the last 7 days
            if (activeHabits.length > 0) {
              const last7Days = Array.from({ length: 7 }, (_, i) => {
                const date = new Date()
                date.setDate(date.getDate() - i)
                return date.toISOString().split('T')[0]
              })

              const allDaysComplete = last7Days.every((day) =>
                activeHabits.every((habit) =>
                  habit.completions.some((c) => c.date === day)
                )
              )
              shouldUnlock = allDaysComplete
            }
            break
        }

        if (shouldUnlock) {
          try {
            // Only show toast if achievement was actually newly unlocked
            const result = await unlockAchievementMutation.mutateAsync({ type: def.type })
            if (result) {
              newlyUnlocked.push(def.type)
              showAchievementToast({
                type: def.type,
                title: t(def.titleKey),
                description: t(def.descriptionKey),
                xp: def.xpReward,
              })
            }
          } catch {
            // Silently ignore unlock errors
          }
        }
      }

      return newlyUnlocked
    } finally {
      isCheckingRef.current = false
    }
  }, [
    habits,
    habitsCompleted,
    tasksCompleted,
    currentStreak,
    longestStreak,
    level,
    hasAchievement,
    unlockAchievementMutation,
    t,
  ])

  // Check achievements when relevant stats change
  useEffect(() => {
    // Wait for all data to be loaded
    if (!isDataReady) return

    // Skip initial render - just store the current values
    if (previousRef.current === null) {
      previousRef.current = { habitsCompleted, tasksCompleted, level }
      return
    }

    // Only check if something actually changed
    const prev = previousRef.current
    if (
      prev.habitsCompleted !== habitsCompleted ||
      prev.tasksCompleted !== tasksCompleted ||
      prev.level !== level
    ) {
      checkAndUnlock()
      previousRef.current = { habitsCompleted, tasksCompleted, level }
    }
  }, [isDataReady, habitsCompleted, tasksCompleted, level, checkAndUnlock])

  return <>{children}</>
}
