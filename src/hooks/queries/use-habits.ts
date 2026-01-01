'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { habitsService, completionsService } from '@/services/habits.service'
import type { Habit } from '@/types'

// Query keys
export const habitsKeys = {
  all: ['habits'] as const,
  lists: () => [...habitsKeys.all, 'list'] as const,
  list: () => [...habitsKeys.lists()] as const,
  active: () => [...habitsKeys.lists(), 'active'] as const,
  archived: () => [...habitsKeys.lists(), 'archived'] as const,
  byArea: (areaId: string) => [...habitsKeys.lists(), 'area', areaId] as const,
  byNotebook: (notebookId: string) => [...habitsKeys.lists(), 'notebook', notebookId] as const,
  details: () => [...habitsKeys.all, 'detail'] as const,
  detail: (id: string) => [...habitsKeys.details(), id] as const,
  streaks: () => [...habitsKeys.all, 'streaks'] as const,
}

// Habits Hooks

export function useHabits() {
  const supabase = createClient()

  return useQuery({
    queryKey: habitsKeys.list(),
    queryFn: () => habitsService.getAll(supabase),
  })
}

export function useActiveHabits() {
  const { data: habits, ...rest } = useHabits()

  return {
    ...rest,
    data: habits?.filter((h) => !h.archivedAt),
  }
}

export function useArchivedHabits() {
  const { data: habits, ...rest } = useHabits()

  return {
    ...rest,
    data: habits?.filter((h) => h.archivedAt),
  }
}

export function useHabit(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: habitsKeys.detail(id),
    queryFn: () => habitsService.getById(supabase, id),
    enabled: !!id,
  })
}

export function useHabitsByArea(areaId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: habitsKeys.byArea(areaId),
    queryFn: () => habitsService.getByArea(supabase, areaId),
    enabled: !!areaId,
  })
}

export function useHabitsByNotebook(notebookId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: habitsKeys.byNotebook(notebookId),
    queryFn: () => habitsService.getByNotebook(supabase, notebookId),
    enabled: !!notebookId,
  })
}

export function useHabitStreaks() {
  const supabase = createClient()

  return useQuery({
    queryKey: habitsKeys.streaks(),
    queryFn: () => completionsService.getStreaks(supabase),
  })
}

export function useCreateHabit() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (habit: Omit<Habit, 'id' | 'createdAt' | 'completions'>) =>
      habitsService.create(supabase, habit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitsKeys.lists() })
    },
  })
}

export function useUpdateHabit() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Omit<Habit, 'id' | 'createdAt' | 'completions'>>
    }) => habitsService.update(supabase, id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: habitsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: habitsKeys.detail(data.id) })
    },
  })
}

export function useDeleteHabit() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => habitsService.delete(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitsKeys.lists() })
    },
  })
}

export function useArchiveHabit() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => habitsService.archive(supabase, id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: habitsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: habitsKeys.detail(data.id) })
    },
  })
}

export function useUnarchiveHabit() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => habitsService.unarchive(supabase, id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: habitsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: habitsKeys.detail(data.id) })
    },
  })
}

export function useReorderHabits() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderedIds: string[]) => habitsService.reorder(supabase, orderedIds),
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: habitsKeys.lists() })

      const previousHabits = queryClient.getQueryData<Habit[]>(habitsKeys.list())

      if (previousHabits) {
        // Reorder habits based on orderedIds
        const habitMap = new Map(previousHabits.map((h) => [h.id, h]))
        const reorderedHabits = orderedIds
          .map((id) => habitMap.get(id))
          .filter((h): h is Habit => h !== undefined)

        // Add any habits not in orderedIds at the end
        previousHabits.forEach((h) => {
          if (!orderedIds.includes(h.id)) {
            reorderedHabits.push(h)
          }
        })

        queryClient.setQueryData(habitsKeys.list(), reorderedHabits)
      }

      return { previousHabits }
    },
    onError: (_err, _orderedIds, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(habitsKeys.list(), context.previousHabits)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: habitsKeys.lists() })
    },
  })
}

// Completion Hooks

export function useToggleCompletion() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      habitId,
      date,
      value = 1,
    }: {
      habitId: string
      date: string
      value?: number
    }) => completionsService.toggle(supabase, habitId, date, value),
    onMutate: async ({ habitId, date, value = 1 }) => {
      await queryClient.cancelQueries({ queryKey: habitsKeys.lists() })

      const previousHabits = queryClient.getQueryData<Habit[]>(habitsKeys.list())

      if (previousHabits) {
        const updatedHabits = previousHabits.map((habit) => {
          if (habit.id !== habitId) return habit

          const existingIndex = habit.completions.findIndex((c) => c.date === date)

          if (existingIndex >= 0) {
            // Remove completion
            return {
              ...habit,
              completions: habit.completions.filter((_, i) => i !== existingIndex),
            }
          }

          // Add completion
          return {
            ...habit,
            completions: [
              ...habit.completions,
              {
                date,
                value,
                completedAt: new Date().toISOString(),
              },
            ],
          }
        })

        queryClient.setQueryData(habitsKeys.list(), updatedHabits)
      }

      return { previousHabits }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(habitsKeys.list(), context.previousHabits)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: habitsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: habitsKeys.streaks() })
    },
  })
}

export function useSetCompletionValue() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      habitId,
      date,
      value,
    }: {
      habitId: string
      date: string
      value: number
    }) => completionsService.setCompletionValue(supabase, habitId, date, value),
    onMutate: async ({ habitId, date, value }) => {
      await queryClient.cancelQueries({ queryKey: habitsKeys.lists() })

      const previousHabits = queryClient.getQueryData<Habit[]>(habitsKeys.list())

      if (previousHabits) {
        const updatedHabits = previousHabits.map((habit) => {
          if (habit.id !== habitId) return habit

          const existingIndex = habit.completions.findIndex((c) => c.date === date)

          if (existingIndex >= 0) {
            // Update existing completion
            const updatedCompletions = [...habit.completions]
            updatedCompletions[existingIndex] = {
              ...updatedCompletions[existingIndex],
              value,
            }
            return { ...habit, completions: updatedCompletions }
          }

          // Add new completion
          return {
            ...habit,
            completions: [
              ...habit.completions,
              {
                date,
                value,
                completedAt: new Date().toISOString(),
              },
            ],
          }
        })

        queryClient.setQueryData(habitsKeys.list(), updatedHabits)
      }

      return { previousHabits }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(habitsKeys.list(), context.previousHabits)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: habitsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: habitsKeys.streaks() })
    },
  })
}

export function useRemoveCompletion() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ habitId, date }: { habitId: string; date: string }) =>
      completionsService.removeCompletion(supabase, habitId, date),
    onMutate: async ({ habitId, date }) => {
      await queryClient.cancelQueries({ queryKey: habitsKeys.lists() })

      const previousHabits = queryClient.getQueryData<Habit[]>(habitsKeys.list())

      if (previousHabits) {
        const updatedHabits = previousHabits.map((habit) => {
          if (habit.id !== habitId) return habit

          return {
            ...habit,
            completions: habit.completions.filter((c) => c.date !== date),
          }
        })

        queryClient.setQueryData(habitsKeys.list(), updatedHabits)
      }

      return { previousHabits }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousHabits) {
        queryClient.setQueryData(habitsKeys.list(), context.previousHabits)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: habitsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: habitsKeys.streaks() })
    },
  })
}

// Helper hooks for common patterns

export function useTodayCompletions() {
  const { data: habits } = useHabits()
  const today = new Date().toISOString().split('T')[0]

  if (!habits) return []

  const completions: Array<{ habitId: string; date: string; value: number }> = []

  habits.forEach((habit) => {
    const completion = habit.completions.find((c) => c.date === today)
    if (completion) {
      completions.push({
        habitId: habit.id,
        date: completion.date,
        value: completion.value,
      })
    }
  })

  return completions
}

export function useHabitsForDate(date: string) {
  const { data: habits } = useActiveHabits()

  if (!habits) return { habits: [], completedCount: 0 }

  // Filter habits that should be done on this date based on frequency
  const dayOfWeek = new Date(date).getDay()

  const habitsForDate = habits.filter((habit) => {
    switch (habit.frequency.type) {
      case 'daily':
        return true
      case 'specificDays':
        return habit.frequency.days.includes(dayOfWeek)
      case 'weekly':
      case 'monthly':
        // For weekly/monthly, show all habits
        return true
      default:
        return true
    }
  })

  const completedCount = habitsForDate.filter((habit) =>
    habit.completions.some((c) => c.date === date)
  ).length

  return {
    habits: habitsForDate,
    completedCount,
    totalCount: habitsForDate.length,
  }
}
