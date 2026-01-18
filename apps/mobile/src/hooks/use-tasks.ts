import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { tasksService, subtasksService } from '@hagu/core'
import type { Task, TaskStatus, Subtask } from '@hagu/core'
import { supabase } from '@/lib/supabase'

const TASKS_KEY = ['tasks']
const PROJECTS_KEY = ['projects']

export function useTasksQuery() {
  return useQuery({
    queryKey: TASKS_KEY,
    queryFn: () => tasksService.getAll(supabase),
  })
}

export function useTaskQuery(id: string | undefined) {
  return useQuery({
    queryKey: [...TASKS_KEY, id],
    queryFn: () => (id ? tasksService.getById(supabase, id) : null),
    enabled: !!id,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (task: Omit<Task, 'id' | 'createdAt' | 'subtasks'>) =>
      tasksService.create(supabase, task),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY })
      // Invalidate project queries if task is linked to a project
      if (data.projectId) {
        queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, data.projectId] })
        queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, 'withProgress'] })
      }
    },
  })
}

export function useUpdateTask() {
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
      queryClient.invalidateQueries({ queryKey: TASKS_KEY })
      // Invalidate project queries if task is linked to a project
      if (data.projectId) {
        queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, data.projectId] })
        queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, 'withProgress'] })
      }
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // Get task first to know if it has a project
      const task = queryClient.getQueryData<Task[]>(TASKS_KEY)?.find((t) => t.id === id)
      await tasksService.delete(supabase, id)
      return { projectId: task?.projectId }
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY })
      // Invalidate project queries if task was linked to a project
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, projectId] })
        queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, 'withProgress'] })
      }
    },
  })
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      const result = await tasksService.setStatus(supabase, id, status)
      return result
    },
    onMutate: async ({ id, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: TASKS_KEY })

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>(TASKS_KEY)

      // Get the task's projectId for later invalidation
      const task = previousTasks?.find((t) => t.id === id)
      const projectId = task?.projectId

      // Optimistically update
      queryClient.setQueryData<Task[]>(TASKS_KEY, (old) =>
        old?.map((t) =>
          t.id === id
            ? {
                ...t,
                status,
                completedAt:
                  status === 'done' ? new Date().toISOString() : undefined,
              }
            : t
        )
      )

      return { previousTasks, projectId }
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(TASKS_KEY, context.previousTasks)
      }
    },
    onSettled: (_, __, ___, context) => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY })
      // Invalidate project queries if task was linked to a project
      if (context?.projectId) {
        queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, context.projectId] })
        queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, 'withProgress'] })
      }
    },
  })
}

export interface TaskStats {
  total: number
  pending: number
  inProgress: number
  done: number
}

export function useTaskStats(tasks: Task[] | undefined): TaskStats {
  return useMemo(() => {
    if (!tasks) {
      return { total: 0, pending: 0, inProgress: 0, done: 0 }
    }

    return tasks.reduce(
      (acc, task) => {
        acc.total++
        switch (task.status) {
          case 'pending':
            acc.pending++
            break
          case 'in_progress':
            acc.inProgress++
            break
          case 'done':
            acc.done++
            break
        }
        return acc
      },
      { total: 0, pending: 0, inProgress: 0, done: 0 }
    )
  }, [tasks])
}

// Subtask hooks
export function useAddSubtask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, title }: { taskId: string; title: string }) =>
      subtasksService.add(supabase, taskId, title),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY })
      queryClient.invalidateQueries({ queryKey: [...TASKS_KEY, taskId] })
    },
  })
}

export function useToggleSubtask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ subtaskId, taskId }: { subtaskId: string; taskId: string }) =>
      subtasksService.toggle(supabase, subtaskId),
    onMutate: async ({ subtaskId, taskId }) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY })

      const previousTasks = queryClient.getQueryData<Task[]>(TASKS_KEY)
      const previousTask = queryClient.getQueryData<Task | null>([...TASKS_KEY, taskId])

      // Optimistic update for task list
      queryClient.setQueryData<Task[]>(TASKS_KEY, (old) =>
        old?.map((task) =>
          task.id === taskId
            ? {
                ...task,
                subtasks: task.subtasks.map((st) =>
                  st.id === subtaskId ? { ...st, done: !st.done } : st
                ),
              }
            : task
        )
      )

      // Optimistic update for single task
      queryClient.setQueryData<Task | null>([...TASKS_KEY, taskId], (old) =>
        old
          ? {
              ...old,
              subtasks: old.subtasks.map((st) =>
                st.id === subtaskId ? { ...st, done: !st.done } : st
              ),
            }
          : old
      )

      return { previousTasks, previousTask }
    },
    onError: (_err, { taskId }, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(TASKS_KEY, context.previousTasks)
      }
      if (context?.previousTask !== undefined) {
        queryClient.setQueryData([...TASKS_KEY, taskId], context.previousTask)
      }
    },
    onSettled: (_, __, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY })
      queryClient.invalidateQueries({ queryKey: [...TASKS_KEY, taskId] })
    },
  })
}

export function useUpdateSubtask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ subtaskId, title }: { subtaskId: string; title: string; taskId: string }) =>
      subtasksService.update(supabase, subtaskId, title),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY })
      queryClient.invalidateQueries({ queryKey: [...TASKS_KEY, taskId] })
    },
  })
}

export function useDeleteSubtask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ subtaskId }: { subtaskId: string; taskId: string }) =>
      subtasksService.delete(supabase, subtaskId),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY })
      queryClient.invalidateQueries({ queryKey: [...TASKS_KEY, taskId] })
    },
  })
}

// Batch operations
export function useDeleteManyTasks() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids: string[]) => {
      // Get tasks first to know which projects are affected
      const tasks = queryClient.getQueryData<Task[]>(TASKS_KEY)
      const affectedProjectIds = tasks
        ?.filter((t) => ids.includes(t.id) && t.projectId)
        .map((t) => t.projectId!) || []

      await tasksService.deleteMany(supabase, ids)
      return { affectedProjectIds: [...new Set(affectedProjectIds)] }
    },
    onSuccess: ({ affectedProjectIds }) => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY })
      // Invalidate project queries for affected projects
      affectedProjectIds.forEach((projectId) => {
        queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, projectId] })
      })
      if (affectedProjectIds.length > 0) {
        queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, 'withProgress'] })
      }
    },
  })
}

export function useUpdateManyTasksStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: TaskStatus }) => {
      // Get tasks first to know which projects are affected
      const tasks = queryClient.getQueryData<Task[]>(TASKS_KEY)
      const affectedProjectIds = tasks
        ?.filter((t) => ids.includes(t.id) && t.projectId)
        .map((t) => t.projectId!) || []

      const results = await Promise.all(
        ids.map((id) => tasksService.setStatus(supabase, id, status))
      )
      return { results, affectedProjectIds: [...new Set(affectedProjectIds)] }
    },
    onSuccess: ({ affectedProjectIds }) => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY })
      // Invalidate project queries for affected projects
      affectedProjectIds.forEach((projectId) => {
        queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, projectId] })
      })
      if (affectedProjectIds.length > 0) {
        queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, 'withProgress'] })
      }
    },
  })
}
