'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { projectsService } from '@/services/projects.service'
import { tasksKeys } from './use-tasks'
import type { Project } from '@/types'

// Query keys
export const projectsKeys = {
  all: ['projects'] as const,
  lists: () => [...projectsKeys.all, 'list'] as const,
  list: () => [...projectsKeys.lists()] as const,
  active: () => [...projectsKeys.lists(), 'active'] as const,
  archived: () => [...projectsKeys.lists(), 'archived'] as const,
  byArea: (areaId: string) => [...projectsKeys.lists(), 'area', areaId] as const,
  details: () => [...projectsKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectsKeys.details(), id] as const,
}

// Projects Hooks

export function useProjects() {
  const supabase = createClient()

  return useQuery({
    queryKey: projectsKeys.list(),
    queryFn: () => projectsService.getAll(supabase),
  })
}

export function useActiveProjects() {
  const supabase = createClient()

  return useQuery({
    queryKey: projectsKeys.active(),
    queryFn: () => projectsService.getActive(supabase),
  })
}

export function useArchivedProjects() {
  const supabase = createClient()

  return useQuery({
    queryKey: projectsKeys.archived(),
    queryFn: () => projectsService.getArchived(supabase),
  })
}

export function useProject(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: projectsKeys.detail(id),
    queryFn: () => projectsService.getById(supabase, id),
    enabled: !!id,
  })
}

export function useProjectsByArea(areaId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: projectsKeys.byArea(areaId),
    queryFn: () => projectsService.getByArea(supabase, areaId),
    enabled: !!areaId,
  })
}

export function useCreateProject() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (project: Omit<Project, 'id' | 'createdAt'>) =>
      projectsService.create(supabase, project),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.lists() })
    },
  })
}

export function useUpdateProject() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Omit<Project, 'id' | 'createdAt'>>
    }) => projectsService.update(supabase, id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectsKeys.detail(data.id) })
    },
  })
}

export function useDeleteProject() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => projectsService.delete(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.lists() })
      // Also invalidate tasks since project references are cleared
      queryClient.invalidateQueries({ queryKey: tasksKeys.lists() })
    },
  })
}

export function useArchiveProject() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => projectsService.archive(supabase, id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectsKeys.detail(data.id) })
    },
  })
}

export function useUnarchiveProject() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => projectsService.unarchive(supabase, id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectsKeys.detail(data.id) })
    },
  })
}
