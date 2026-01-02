'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import {
  projectsService,
  objectivesService,
  milestonesService,
  projectMetricsService,
} from '@/services/projects.service'
import { tasksKeys } from './use-tasks'
import { habitsKeys } from './use-habits'
import type {
  Project,
  ProjectStatus,
  Objective,
  Milestone,
  ProjectMetric,
  CreateProjectData,
  UpdateProjectData,
  CreateObjectiveData,
  UpdateObjectiveData,
  CreateMilestoneData,
  UpdateMilestoneData,
  CreateProjectMetricData,
  UpdateProjectMetricData,
} from '@/types'

// Query keys
export const projectsKeys = {
  all: ['projects'] as const,
  lists: () => [...projectsKeys.all, 'list'] as const,
  list: () => [...projectsKeys.lists()] as const,
  active: () => [...projectsKeys.lists(), 'active'] as const,
  archived: () => [...projectsKeys.lists(), 'archived'] as const,
  byStatus: (status: ProjectStatus) => [...projectsKeys.lists(), 'status', status] as const,
  byArea: (areaId: string) => [...projectsKeys.lists(), 'area', areaId] as const,
  withProgress: () => [...projectsKeys.lists(), 'withProgress'] as const,
  details: () => [...projectsKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectsKeys.details(), id] as const,
  detailWithProgress: (id: string) => [...projectsKeys.details(), id, 'withProgress'] as const,
}

export const objectivesKeys = {
  all: ['objectives'] as const,
  lists: () => [...objectivesKeys.all, 'list'] as const,
  byProject: (projectId: string) => [...objectivesKeys.lists(), 'project', projectId] as const,
  details: () => [...objectivesKeys.all, 'detail'] as const,
  detail: (id: string) => [...objectivesKeys.details(), id] as const,
}

export const milestonesKeys = {
  all: ['milestones'] as const,
  lists: () => [...milestonesKeys.all, 'list'] as const,
  byProject: (projectId: string) => [...milestonesKeys.lists(), 'project', projectId] as const,
  upcoming: (days?: number) => [...milestonesKeys.lists(), 'upcoming', days ?? 30] as const,
  details: () => [...milestonesKeys.all, 'detail'] as const,
  detail: (id: string) => [...milestonesKeys.details(), id] as const,
}

export const projectMetricsKeys = {
  all: ['projectMetrics'] as const,
  lists: () => [...projectMetricsKeys.all, 'list'] as const,
  byProject: (projectId: string) => [...projectMetricsKeys.lists(), 'project', projectId] as const,
  details: () => [...projectMetricsKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectMetricsKeys.details(), id] as const,
  history: (metricId: string, days?: number) =>
    [...projectMetricsKeys.detail(metricId), 'history', days ?? 30] as const,
}

// ============================================
// PROJECTS HOOKS
// ============================================

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

export function useProjectsByStatus(status: ProjectStatus) {
  const supabase = createClient()

  return useQuery({
    queryKey: projectsKeys.byStatus(status),
    queryFn: () => projectsService.getByStatus(supabase, status),
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

export function useProjectsWithProgress() {
  const supabase = createClient()

  return useQuery({
    queryKey: projectsKeys.withProgress(),
    queryFn: () => projectsService.getAllWithProgress(supabase),
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

export function useProjectWithProgress(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: projectsKeys.detailWithProgress(id),
    queryFn: () => projectsService.getByIdWithProgress(supabase, id),
    enabled: !!id,
  })
}

export function useCreateProject() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (project: CreateProjectData) => projectsService.create(supabase, project),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.lists() })
    },
  })
}

export function useUpdateProject() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateProjectData }) =>
      projectsService.update(supabase, id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectsKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: projectsKeys.detailWithProgress(data.id) })
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
      queryClient.invalidateQueries({ queryKey: tasksKeys.lists() })
      queryClient.invalidateQueries({ queryKey: habitsKeys.lists() })
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

export function useCompleteProject() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => projectsService.complete(supabase, id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectsKeys.detail(data.id) })
    },
  })
}

export function usePauseProject() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => projectsService.pause(supabase, id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectsKeys.detail(data.id) })
    },
  })
}

export function useResumeProject() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => projectsService.resume(supabase, id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: projectsKeys.detail(data.id) })
    },
  })
}

// ============================================
// OBJECTIVES HOOKS
// ============================================

export function useObjectivesByProject(projectId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: objectivesKeys.byProject(projectId),
    queryFn: () => objectivesService.getByProject(supabase, projectId),
    enabled: !!projectId,
  })
}

export function useObjective(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: objectivesKeys.detail(id),
    queryFn: () => objectivesService.getById(supabase, id),
    enabled: !!id,
  })
}

export function useCreateObjective() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (objective: CreateObjectiveData) => objectivesService.create(supabase, objective),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: objectivesKeys.byProject(data.projectId) })
      queryClient.invalidateQueries({ queryKey: projectsKeys.detailWithProgress(data.projectId) })
      queryClient.invalidateQueries({ queryKey: projectsKeys.withProgress() })
    },
  })
}

export function useUpdateObjective() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      updates,
      projectId,
    }: {
      id: string
      updates: UpdateObjectiveData
      projectId: string
    }) => objectivesService.update(supabase, id, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: objectivesKeys.byProject(variables.projectId) })
      queryClient.invalidateQueries({ queryKey: objectivesKeys.detail(data.id) })
      queryClient.invalidateQueries({
        queryKey: projectsKeys.detailWithProgress(variables.projectId),
      })
      queryClient.invalidateQueries({ queryKey: projectsKeys.withProgress() })
    },
  })
}

export function useDeleteObjective() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
      objectivesService.delete(supabase, id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: objectivesKeys.byProject(variables.projectId) })
      queryClient.invalidateQueries({
        queryKey: projectsKeys.detailWithProgress(variables.projectId),
      })
      queryClient.invalidateQueries({ queryKey: projectsKeys.withProgress() })
      queryClient.invalidateQueries({ queryKey: tasksKeys.lists() })
    },
  })
}

export function useCompleteObjective() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
      objectivesService.complete(supabase, id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: objectivesKeys.byProject(variables.projectId) })
      queryClient.invalidateQueries({ queryKey: objectivesKeys.detail(data.id) })
      queryClient.invalidateQueries({
        queryKey: projectsKeys.detailWithProgress(variables.projectId),
      })
      queryClient.invalidateQueries({ queryKey: projectsKeys.withProgress() })
    },
  })
}

export function useReorderObjectives() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderedIds, projectId }: { orderedIds: string[]; projectId: string }) =>
      objectivesService.reorder(supabase, orderedIds),
    onMutate: async ({ orderedIds, projectId }) => {
      await queryClient.cancelQueries({ queryKey: objectivesKeys.byProject(projectId) })

      const previousObjectives = queryClient.getQueryData<Objective[]>(
        objectivesKeys.byProject(projectId)
      )

      if (previousObjectives) {
        const objectiveMap = new Map(previousObjectives.map((o) => [o.id, o]))
        const reorderedObjectives = orderedIds
          .map((id) => objectiveMap.get(id))
          .filter((o): o is Objective => o !== undefined)

        queryClient.setQueryData(objectivesKeys.byProject(projectId), reorderedObjectives)
      }

      return { previousObjectives }
    },
    onError: (_err, { projectId }, context) => {
      if (context?.previousObjectives) {
        queryClient.setQueryData(objectivesKeys.byProject(projectId), context.previousObjectives)
      }
    },
    onSettled: (_, __, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: objectivesKeys.byProject(projectId) })
    },
  })
}

// ============================================
// MILESTONES HOOKS
// ============================================

export function useMilestonesByProject(projectId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: milestonesKeys.byProject(projectId),
    queryFn: () => milestonesService.getByProject(supabase, projectId),
    enabled: !!projectId,
  })
}

export function useMilestone(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: milestonesKeys.detail(id),
    queryFn: () => milestonesService.getById(supabase, id),
    enabled: !!id,
  })
}

export function useUpcomingMilestones(days: number = 30) {
  const supabase = createClient()

  return useQuery({
    queryKey: milestonesKeys.upcoming(days),
    queryFn: () => milestonesService.getUpcoming(supabase, days),
  })
}

export function useCreateMilestone() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (milestone: CreateMilestoneData) => milestonesService.create(supabase, milestone),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: milestonesKeys.byProject(data.projectId) })
      queryClient.invalidateQueries({ queryKey: milestonesKeys.upcoming() })
      queryClient.invalidateQueries({ queryKey: projectsKeys.detailWithProgress(data.projectId) })
    },
  })
}

export function useUpdateMilestone() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      updates,
      projectId,
    }: {
      id: string
      updates: UpdateMilestoneData
      projectId: string
    }) => milestonesService.update(supabase, id, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: milestonesKeys.byProject(variables.projectId) })
      queryClient.invalidateQueries({ queryKey: milestonesKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: milestonesKeys.upcoming() })
      queryClient.invalidateQueries({
        queryKey: projectsKeys.detailWithProgress(variables.projectId),
      })
    },
  })
}

export function useDeleteMilestone() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
      milestonesService.delete(supabase, id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: milestonesKeys.byProject(variables.projectId) })
      queryClient.invalidateQueries({ queryKey: milestonesKeys.upcoming() })
      queryClient.invalidateQueries({
        queryKey: projectsKeys.detailWithProgress(variables.projectId),
      })
    },
  })
}

export function useCompleteMilestone() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
      milestonesService.complete(supabase, id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: milestonesKeys.byProject(variables.projectId) })
      queryClient.invalidateQueries({ queryKey: milestonesKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: milestonesKeys.upcoming() })
      queryClient.invalidateQueries({
        queryKey: projectsKeys.detailWithProgress(variables.projectId),
      })
    },
  })
}

// ============================================
// PROJECT METRICS HOOKS
// ============================================

export function useProjectMetricsByProject(projectId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: projectMetricsKeys.byProject(projectId),
    queryFn: () => projectMetricsService.getByProject(supabase, projectId),
    enabled: !!projectId,
  })
}

export function useProjectMetric(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: projectMetricsKeys.detail(id),
    queryFn: () => projectMetricsService.getById(supabase, id),
    enabled: !!id,
  })
}

export function useProjectMetricHistory(metricId: string, days: number = 30) {
  const supabase = createClient()

  return useQuery({
    queryKey: projectMetricsKeys.history(metricId, days),
    queryFn: () => projectMetricsService.getHistory(supabase, metricId, days),
    enabled: !!metricId,
  })
}

export function useCreateProjectMetric() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (metric: CreateProjectMetricData) => projectMetricsService.create(supabase, metric),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: projectMetricsKeys.byProject(data.projectId) })
    },
  })
}

export function useUpdateProjectMetric() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      updates,
      projectId,
    }: {
      id: string
      updates: UpdateProjectMetricData
      projectId: string
    }) => projectMetricsService.update(supabase, id, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: projectMetricsKeys.byProject(variables.projectId) })
      queryClient.invalidateQueries({ queryKey: projectMetricsKeys.detail(data.id) })
    },
  })
}

export function useDeleteProjectMetric() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
      projectMetricsService.delete(supabase, id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: projectMetricsKeys.byProject(variables.projectId) })
    },
  })
}

export function useUpdateProjectMetricValue() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      value,
      recordHistory = true,
      projectId,
    }: {
      id: string
      value: number
      recordHistory?: boolean
      projectId: string
    }) => projectMetricsService.updateValue(supabase, id, value, recordHistory),
    onMutate: async ({ id, value, projectId }) => {
      await queryClient.cancelQueries({ queryKey: projectMetricsKeys.byProject(projectId) })

      const previousMetrics = queryClient.getQueryData<ProjectMetric[]>(
        projectMetricsKeys.byProject(projectId)
      )

      if (previousMetrics) {
        const updatedMetrics = previousMetrics.map((m) =>
          m.id === id ? { ...m, currentValue: value } : m
        )
        queryClient.setQueryData(projectMetricsKeys.byProject(projectId), updatedMetrics)
      }

      return { previousMetrics }
    },
    onError: (_err, { projectId }, context) => {
      if (context?.previousMetrics) {
        queryClient.setQueryData(projectMetricsKeys.byProject(projectId), context.previousMetrics)
      }
    },
    onSettled: (data, _err, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectMetricsKeys.byProject(projectId) })
      if (data) {
        queryClient.invalidateQueries({ queryKey: projectMetricsKeys.detail(data.id) })
        queryClient.invalidateQueries({ queryKey: projectMetricsKeys.history(data.id) })
      }
    },
  })
}
