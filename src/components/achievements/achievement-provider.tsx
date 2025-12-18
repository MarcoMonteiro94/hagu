'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useGamificationStore } from '@/stores/gamification'
import { useHabitsStore } from '@/stores/habits'
import { useTasksStore } from '@/stores/tasks'
import { ACHIEVEMENT_DEFINITIONS, getAchievementDefinition } from '@/config/achievements'
import { showAchievementToast } from './achievement-toast'

export function AchievementProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations('achievements')
  const previousRef = useRef<{
    habitsCompleted: number
    tasksCompleted: number
    level: number
  } | null>(null)

  const {
    habitsCompleted,
    tasksCompleted,
    currentStreak,
    longestStreak,
    level,
    hasAchievement,
    unlockAchievement,
    achievements,
  } = useGamificationStore()

  const habits = useHabitsStore((state) => state.habits)
  const tasks = useTasksStore((state) => state.tasks)

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
        unlockAchievement(def.type)
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
    unlockAchievement,
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
