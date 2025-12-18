import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import type { Habit, HabitCompletion } from '@/types'

interface HabitsState {
  habits: Habit[]
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'completions'>) => void
  updateHabit: (id: string, updates: Partial<Omit<Habit, 'id' | 'createdAt'>>) => void
  deleteHabit: (id: string) => void
  archiveHabit: (id: string) => void
  toggleCompletion: (habitId: string, date: string, value?: number) => void
  getHabitById: (id: string) => Habit | undefined
  getHabitsByArea: (areaId: string) => Habit[]
  getActiveHabits: () => Habit[]
  getCompletionsForDate: (date: string) => Array<{ habitId: string; completion: HabitCompletion }>
}

function generateId(): string {
  return crypto.randomUUID()
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

export const useHabitsStore = create<HabitsState>()(
  persist(
    (set, get) => ({
      habits: [],

      addHabit: (habitData) => {
        const habit: Habit = {
          ...habitData,
          id: generateId(),
          createdAt: new Date().toISOString(),
          completions: [],
        }
        set((state) => ({ habits: [...state.habits, habit] }))
      },

      updateHabit: (id, updates) => {
        set((state) => ({
          habits: state.habits.map((habit) =>
            habit.id === id ? { ...habit, ...updates } : habit
          ),
        }))
      },

      deleteHabit: (id) => {
        set((state) => ({
          habits: state.habits.filter((habit) => habit.id !== id),
        }))
      },

      archiveHabit: (id) => {
        set((state) => ({
          habits: state.habits.map((habit) =>
            habit.id === id
              ? { ...habit, archivedAt: new Date().toISOString() }
              : habit
          ),
        }))
      },

      toggleCompletion: (habitId, date, value = 1) => {
        set((state) => ({
          habits: state.habits.map((habit) => {
            if (habit.id !== habitId) return habit

            const existingIndex = habit.completions.findIndex(
              (c) => c.date === date
            )

            if (existingIndex >= 0) {
              // Remove completion (toggle off)
              return {
                ...habit,
                completions: habit.completions.filter((_, i) => i !== existingIndex),
              }
            }

            // Add completion
            const completion: HabitCompletion = {
              date,
              value,
              completedAt: new Date().toISOString(),
            }

            return {
              ...habit,
              completions: [...habit.completions, completion],
            }
          }),
        }))
      },

      getHabitById: (id) => {
        return get().habits.find((habit) => habit.id === id)
      },

      getHabitsByArea: (areaId) => {
        return get().habits.filter(
          (habit) => habit.areaId === areaId && !habit.archivedAt
        )
      },

      getActiveHabits: () => {
        return get().habits.filter((habit) => !habit.archivedAt)
      },

      getCompletionsForDate: (date) => {
        const habits = get().habits
        const completions: Array<{ habitId: string; completion: HabitCompletion }> = []

        habits.forEach((habit) => {
          const completion = habit.completions.find((c) => c.date === date)
          if (completion) {
            completions.push({ habitId: habit.id, completion })
          }
        })

        return completions
      },
    }),
    {
      name: 'hagu-habits',
    }
  )
)

// Selector hooks for common queries
export function useActiveHabits(): Habit[] {
  return useHabitsStore(
    useShallow((state) => state.habits.filter((h) => !h.archivedAt))
  )
}

export function useTodayCompletions() {
  const today = getTodayString()
  const habits = useHabitsStore(useShallow((state) => state.habits))
  const completions: Array<{ habitId: string; completion: HabitCompletion }> = []

  habits.forEach((habit) => {
    const completion = habit.completions.find((c) => c.date === today)
    if (completion) {
      completions.push({ habitId: habit.id, completion })
    }
  })

  return completions
}
