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

  const { data: stats } = useUserStats()
  const { data: achievements = [] } = useAchievements()
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

  const { data: habits = [] } = useHabits()
  const { data: tasks = [] } = useTasks()

  const checkAndUnlock = useCallback(() => {
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
        unlockAchievementMutation.mutate({ type: def.type })
        newlyUnlocked.push(def.type)
      }
    }

    // Show toasts for newly unlocked achievements
    for (const type of newlyUnlocked) {
      const def = getAchievementDefinition(type)
      if (def) {
        showAchievementToast({
          type,
          title: t(def.titleKey),
          description: t(def.descriptionKey),
          xp: def.xpReward,
        })
      }
    }

    return newlyUnlocked
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
    // Skip initial render
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
  }, [habitsCompleted, tasksCompleted, level, checkAndUnlock])

  return <>{children}</>
}
