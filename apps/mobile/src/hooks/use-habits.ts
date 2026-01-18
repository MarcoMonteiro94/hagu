import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { habitsService, completionsService } from '@hagu/core'
import type { Habit, HabitFrequency, HabitTracking } from '@hagu/core'
import { supabase } from '@/lib/supabase'

const HABITS_KEY = ['habits']

export function useHabitsQuery() {
  return useQuery({
    queryKey: HABITS_KEY,
    queryFn: () => habitsService.getAll(supabase),
  })
}

export function useHabitQuery(id: string | undefined) {
  return useQuery({
    queryKey: [...HABITS_KEY, id],
    queryFn: () => (id ? habitsService.getById(supabase, id) : null),
    enabled: !!id,
  })
}

export interface CreateHabitData {
  title: string
  description?: string
  areaId: string
  projectId?: string
  frequency: HabitFrequency
  tracking: HabitTracking
  color: string
  icon?: string
  notebookId?: string
}

export function useCreateHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (habit: CreateHabitData) => habitsService.create(supabase, habit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HABITS_KEY })
    },
  })
}

export interface UpdateHabitData {
  id: string
  updates: Partial<Omit<Habit, 'id' | 'createdAt' | 'completions'>>
}

export function useUpdateHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: UpdateHabitData) =>
      habitsService.update(supabase, id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HABITS_KEY })
    },
  })
}

export function useDeleteHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => habitsService.delete(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HABITS_KEY })
    },
  })
}

export function useArchiveHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => habitsService.archive(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HABITS_KEY })
    },
  })
}

export function useUnarchiveHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => habitsService.unarchive(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HABITS_KEY })
    },
  })
}

export function useToggleHabitCompletion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ habitId, date, value = 1 }: { habitId: string; date: string; value?: number }) =>
      completionsService.toggle(supabase, habitId, date, value),
    onMutate: async ({ habitId, date }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: HABITS_KEY })

      // Snapshot the previous value
      const previousHabits = queryClient.getQueryData<Habit[]>(HABITS_KEY)

      // Optimistically update
      queryClient.setQueryData<Habit[]>(HABITS_KEY, (old) =>
        old?.map((habit) => {
          if (habit.id !== habitId) return habit
          const hasCompletion = habit.completions.some((c) => c.date === date)
          return {
            ...habit,
            completions: hasCompletion
              ? habit.completions.filter((c) => c.date !== date)
              : [
                  ...habit.completions,
                  { date, value: 1, completedAt: new Date().toISOString() },
                ],
          }
        })
      )

      return { previousHabits }
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousHabits) {
        queryClient.setQueryData(HABITS_KEY, context.previousHabits)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: HABITS_KEY })
    },
  })
}

export function useSetCompletionValue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ habitId, date, value }: { habitId: string; date: string; value: number }) =>
      completionsService.setCompletionValue(supabase, habitId, date, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HABITS_KEY })
    },
  })
}

export interface HabitStats {
  total: number
  active: number
  archived: number
  completedToday: number
  maxStreak: number
}

export function useHabitStats(habits: Habit[] | undefined): HabitStats {
  return useMemo(() => {
    if (!habits) {
      return { total: 0, active: 0, archived: 0, completedToday: 0, maxStreak: 0 }
    }

    const today = new Date().toISOString().split('T')[0]

    return habits.reduce(
      (acc, habit) => {
        acc.total++
        if (habit.archivedAt) {
          acc.archived++
        } else {
          acc.active++
        }
        if (habit.completions.some((c) => c.date === today)) {
          acc.completedToday++
        }
        return acc
      },
      { total: 0, active: 0, archived: 0, completedToday: 0, maxStreak: 0 }
    )
  }, [habits])
}
