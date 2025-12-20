'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { tasksService, subtasksService } from '@/services/tasks.service'
import type { Task, TaskStatus } from '@/types'

// Query keys
export const tasksKeys = {
  all: ['tasks'] as const,
  lists: () => [...tasksKeys.all, 'list'] as const,
  list: () => [...tasksKeys.lists()] as const,
  byStatus: (status: TaskStatus) => [...tasksKeys.lists(), 'status', status] as const,
  byProject: (projectId: string) => [...tasksKeys.lists(), 'project', projectId] as const,
  byArea: (areaId: string) => [...tasksKeys.lists(), 'area', areaId] as const,
  details: () => [...tasksKeys.all, 'detail'] as const,
  detail: (id: string) => [...tasksKeys.details(), id] as const,
}

// Task Hooks

export function useTasks() {
  const supabase = createClient()

  return useQuery({
    queryKey: tasksKeys.list(),
    queryFn: () => tasksService.getAll(supabase),
  })
}

export function useTask(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: tasksKeys.detail(id),
    queryFn: () => tasksService.getById(supabase, id),
    enabled: !!id,
  })
}

export function useTasksByStatus(status: TaskStatus) {
  const supabase = createClient()

  return useQuery({
    queryKey: tasksKeys.byStatus(status),
    queryFn: () => tasksService.getByStatus(supabase, status),
  })
}

export function useTasksByProject(projectId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: tasksKeys.byProject(projectId),
    queryFn: () => tasksService.getByProject(supabase, projectId),
    enabled: !!projectId,
  })
}

export function useTasksByArea(areaId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: tasksKeys.byArea(areaId),
    queryFn: () => tasksService.getByArea(supabase, areaId),
    enabled: !!areaId,
  })
}

export function useCreateTask() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (task: Omit<Task, 'id' | 'createdAt' | 'subtasks'>) =>
      tasksService.create(supabase, task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksKeys.lists() })
    },
  })
}

export function useUpdateTask() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Omit<Task, 'id' | 'createdAt' | 'subtasks'>>
    }) => tasksService.update(supabase, id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: tasksKeys.lists() })
      queryClient.invalidateQueries({ queryKey: tasksKeys.detail(data.id) })
    },
  })
}

export function useDeleteTask() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => tasksService.delete(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksKeys.lists() })
    },
  })
}

export function useSetTaskStatus() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      tasksService.setStatus(supabase, id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: tasksKeys.lists() })

      const previousTasks = queryClient.getQueryData<Task[]>(tasksKeys.list())

      if (previousTasks) {
        const updatedTasks = previousTasks.map((task) =>
          task.id === id
            ? {
                ...task,
                status,
                completedAt: status === 'done' ? new Date().toISOString() : undefined,
              }
            : task
        )
        queryClient.setQueryData(tasksKeys.list(), updatedTasks)
      }

      return { previousTasks }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(tasksKeys.list(), context.previousTasks)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: tasksKeys.lists() })
      // Also invalidate transactions in case a payment reminder task was completed
      queryClient.invalidateQueries({ queryKey: ['finances', 'transactions'] })
    },
  })
}

export function useReorderTasks() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderedIds: string[]) => tasksService.reorder(supabase, orderedIds),
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: tasksKeys.lists() })

      const previousTasks = queryClient.getQueryData<Task[]>(tasksKeys.list())

      if (previousTasks) {
        const taskMap = new Map(previousTasks.map((t) => [t.id, t]))
        const reorderedTasks = orderedIds
          .map((id) => taskMap.get(id))
          .filter((t): t is Task => t !== undefined)

        previousTasks.forEach((t) => {
          if (!orderedIds.includes(t.id)) {
            reorderedTasks.push(t)
          }
        })

        queryClient.setQueryData(tasksKeys.list(), reorderedTasks)
      }

      return { previousTasks }
    },
    onError: (_err, _orderedIds, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(tasksKeys.list(), context.previousTasks)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: tasksKeys.lists() })
    },
  })
}

// Subtask Hooks

export function useAddSubtask() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, title }: { taskId: string; title: string }) =>
      subtasksService.add(supabase, taskId, title),
    onSuccess: (_data, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: tasksKeys.lists() })
      queryClient.invalidateQueries({ queryKey: tasksKeys.detail(taskId) })
    },
  })
}

export function useToggleSubtask() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ subtaskId }: { subtaskId: string; taskId: string }) =>
      subtasksService.toggle(supabase, subtaskId),
    onMutate: async ({ subtaskId, taskId }) => {
      await queryClient.cancelQueries({ queryKey: tasksKeys.lists() })

      const previousTasks = queryClient.getQueryData<Task[]>(tasksKeys.list())

      if (previousTasks) {
        const updatedTasks = previousTasks.map((task) =>
          task.id === taskId
            ? {
                ...task,
                subtasks: task.subtasks.map((st) =>
                  st.id === subtaskId ? { ...st, done: !st.done } : st
                ),
              }
            : task
        )
        queryClient.setQueryData(tasksKeys.list(), updatedTasks)
      }

      return { previousTasks }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(tasksKeys.list(), context.previousTasks)
      }
    },
    onSettled: (_data, _err, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: tasksKeys.lists() })
      queryClient.invalidateQueries({ queryKey: tasksKeys.detail(taskId) })
    },
  })
}

export function useDeleteSubtask() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ subtaskId }: { subtaskId: string; taskId: string }) =>
      subtasksService.delete(supabase, subtaskId),
    onSuccess: (_data, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: tasksKeys.lists() })
      queryClient.invalidateQueries({ queryKey: tasksKeys.detail(taskId) })
    },
  })
}

// Helper hooks

export function useTodayTasks() {
  const { data: tasks, isLoading } = useTasks()
  const today = new Date().toISOString().split('T')[0]

  const filteredTasks = tasks?.filter((task) => task.dueDate === today && task.status !== 'done') ?? []

  return { tasks: filteredTasks, isLoading }
}

export function usePendingTasks() {
  const { data: tasks } = useTasks()

  if (!tasks) return []

  return tasks.filter((task) => task.status === 'pending')
}

export function useTasksForDate(date: string) {
  const { data: tasks } = useTasks()

  if (!tasks) return []

  return tasks.filter((task) => task.dueDate === date)
}
