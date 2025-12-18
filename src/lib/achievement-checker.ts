import { useGamificationStore } from '@/stores/gamification'
import { useHabitsStore } from '@/stores/habits'
import { ACHIEVEMENT_DEFINITIONS } from '@/config/achievements'

interface CheckContext {
  habitsCompleted: number
  tasksCompleted: number
  currentStreak: number
  longestStreak: number
  level: number
  hasAchievement: (type: string) => boolean
  unlockAchievement: (type: string) => void
  activeHabitsCount: number
  todayCompletedHabits: number
}

function checkAndUnlockAchievements(context: CheckContext): string[] {
  const newlyUnlocked: string[] = []

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    // Skip if already unlocked
    if (context.hasAchievement(def.type)) continue

    let shouldUnlock = false

    switch (def.requirement.type) {
      case 'first_habit':
        shouldUnlock = context.habitsCompleted >= 1
        break

      case 'first_task':
        shouldUnlock = context.tasksCompleted >= 1
        break

      case 'habits_completed':
        shouldUnlock = context.habitsCompleted >= (def.requirement.value || 0)
        break

      case 'tasks_completed':
        shouldUnlock = context.tasksCompleted >= (def.requirement.value || 0)
        break

      case 'streak':
        shouldUnlock = context.currentStreak >= (def.requirement.value || 0) ||
                       context.longestStreak >= (def.requirement.value || 0)
        break

      case 'level':
        shouldUnlock = context.level >= (def.requirement.value || 0)
        break

      case 'perfect_day':
        // Perfect day: all active habits completed today
        shouldUnlock = context.activeHabitsCount > 0 &&
                       context.todayCompletedHabits >= context.activeHabitsCount
        break

      case 'perfect_week':
        // This would require more complex tracking, skip for now
        // Could be implemented by checking last 7 days of completions
        break
    }

    if (shouldUnlock) {
      context.unlockAchievement(def.type)
      newlyUnlocked.push(def.type)
    }
  }

  return newlyUnlocked
}

export function useAchievementChecker() {
  const {
    habitsCompleted,
    tasksCompleted,
    currentStreak,
    longestStreak,
    level,
    hasAchievement,
    unlockAchievement,
  } = useGamificationStore()

  const habits = useHabitsStore((state) => state.habits)

  const checkAchievements = (): string[] => {
    const today = new Date().toISOString().split('T')[0]
    const activeHabits = habits.filter((h) => !h.archivedAt)
    const todayCompletedHabits = activeHabits.filter((h) =>
      h.completions.some((c) => c.date === today)
    ).length

    return checkAndUnlockAchievements({
      habitsCompleted,
      tasksCompleted,
      currentStreak,
      longestStreak,
      level,
      hasAchievement,
      unlockAchievement,
      activeHabitsCount: activeHabits.length,
      todayCompletedHabits,
    })
  }

  return { checkAchievements }
}

// Standalone function to check achievements (for use in stores)
export function checkAchievementsStandalone(
  gamificationState: {
    habitsCompleted: number
    tasksCompleted: number
    currentStreak: number
    longestStreak: number
    level: number
    hasAchievement: (type: string) => boolean
    unlockAchievement: (type: string) => void
  },
  activeHabitsCount: number,
  todayCompletedHabits: number
): string[] {
  return checkAndUnlockAchievements({
    ...gamificationState,
    activeHabitsCount,
    todayCompletedHabits,
  })
}
