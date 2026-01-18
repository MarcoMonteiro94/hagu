import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  projectsService,
  objectivesService,
  milestonesService,
} from '@hagu/core'
import type {
  Project,
  ProjectWithProgress,
  ProjectStatus,
  Objective,
  ObjectiveStatus,
  Milestone,
  MilestoneStatus,
  CreateProjectData,
  UpdateProjectData,
  CreateObjectiveData,
  UpdateObjectiveData,
  CreateMilestoneData,
  UpdateMilestoneData,
} from '@hagu/core'
import { supabase } from '@/lib/supabase'

// Query keys
const PROJECTS_KEY = ['projects']
const OBJECTIVES_KEY = ['objectives']
const MILESTONES_KEY = ['milestones']

// ============ Projects Queries ============

export function useProjectsQuery() {
  return useQuery({
    queryKey: PROJECTS_KEY,
    queryFn: () => projectsService.getAll(supabase),
  })
}

export function useActiveProjectsQuery() {
  return useQuery({
    queryKey: [...PROJECTS_KEY, 'active'],
    queryFn: () => projectsService.getActive(supabase),
  })
}

export function useProjectsWithProgressQuery() {
  return useQuery({
    queryKey: [...PROJECTS_KEY, 'withProgress'],
    queryFn: () => projectsService.getAllWithProgress(supabase),
  })
}

export function useArchivedProjectsQuery() {
  return useQuery({
    queryKey: [...PROJECTS_KEY, 'archived'],
    queryFn: () => projectsService.getArchived(supabase),
  })
}

export function useProjectQuery(id: string | undefined) {
  return useQuery({
    queryKey: [...PROJECTS_KEY, id],
    queryFn: () => (id ? projectsService.getById(supabase, id) : null),
    enabled: !!id,
  })
}

export function useProjectWithProgressQuery(id: string | undefined) {
  return useQuery({
    queryKey: [...PROJECTS_KEY, id, 'withProgress'],
    queryFn: () => (id ? projectsService.getByIdWithProgress(supabase, id) : null),
    enabled: !!id,
  })
}

// ============ Projects Mutations ============

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (project: CreateProjectData) => projectsService.create(supabase, project),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateProjectData }) =>
      projectsService.update(supabase, id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY })
      queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, id] })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => projectsService.delete(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY })
    },
  })
}

export function useArchiveProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => projectsService.archive(supabase, id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY })
      queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, id] })
    },
  })
}

export function useUnarchiveProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => projectsService.unarchive(supabase, id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY })
      queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, id] })
    },
  })
}

export function useCompleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => projectsService.complete(supabase, id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY })
      queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, id] })
    },
  })
}

export function usePauseProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => projectsService.pause(supabase, id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY })
      queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, id] })
    },
  })
}

export function useResumeProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => projectsService.resume(supabase, id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY })
      queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, id] })
    },
  })
}

export function useUpdateProjectStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProjectStatus }) =>
      projectsService.update(supabase, id, { status }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: PROJECTS_KEY })
      queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, id] })
    },
  })
}

// ============ Objectives Queries ============

export function useObjectivesQuery(projectId: string | undefined) {
  return useQuery({
    queryKey: [...OBJECTIVES_KEY, projectId],
    queryFn: () => (projectId ? objectivesService.getByProject(supabase, projectId) : []),
    enabled: !!projectId,
  })
}

// ============ Objectives Mutations ============

export function useCreateObjective() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (objective: CreateObjectiveData) => objectivesService.create(supabase, objective),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [...OBJECTIVES_KEY, data.projectId] })
      queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, data.projectId] })
    },
  })
}

export function useUpdateObjective() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      projectId,
      updates,
    }: {
      id: string
      projectId: string
      updates: UpdateObjectiveData
    }) => objectivesService.update(supabase, id, updates),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: [...OBJECTIVES_KEY, projectId] })
      queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, projectId] })
    },
  })
}

export function useDeleteObjective() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
      objectivesService.delete(supabase, id),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: [...OBJECTIVES_KEY, projectId] })
      queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, projectId] })
    },
  })
}

export function useToggleObjectiveStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      projectId,
      currentStatus,
    }: {
      id: string
      projectId: string
      currentStatus: ObjectiveStatus
    }) => {
      const newStatus: ObjectiveStatus = currentStatus === 'completed' ? 'pending' : 'completed'
      return objectivesService.update(supabase, id, { status: newStatus })
    },
    onMutate: async ({ id, projectId, currentStatus }) => {
      await queryClient.cancelQueries({ queryKey: [...OBJECTIVES_KEY, projectId] })

      const previousObjectives = queryClient.getQueryData<Objective[]>([
        ...OBJECTIVES_KEY,
        projectId,
      ])

      if (previousObjectives) {
        const newStatus: ObjectiveStatus = currentStatus === 'completed' ? 'pending' : 'completed'
        queryClient.setQueryData(
          [...OBJECTIVES_KEY, projectId],
          previousObjectives.map((o) =>
            o.id === id
              ? {
                  ...o,
                  status: newStatus,
                  completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
                }
              : o
          )
        )
      }

      return { previousObjectives }
    },
    onError: (err, { projectId }, context) => {
      if (context?.previousObjectives) {
        queryClient.setQueryData([...OBJECTIVES_KEY, projectId], context.previousObjectives)
      }
    },
    onSettled: (_, __, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: [...OBJECTIVES_KEY, projectId] })
      queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, projectId] })
    },
  })
}

// ============ Milestones Queries ============

export function useMilestonesQuery(projectId: string | undefined) {
  return useQuery({
    queryKey: [...MILESTONES_KEY, projectId],
    queryFn: () => (projectId ? milestonesService.getByProject(supabase, projectId) : []),
    enabled: !!projectId,
  })
}

export function useUpcomingMilestonesQuery(days: number = 30) {
  return useQuery({
    queryKey: [...MILESTONES_KEY, 'upcoming', days],
    queryFn: () => milestonesService.getUpcoming(supabase, days),
  })
}

// ============ Milestones Mutations ============

export function useCreateMilestone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (milestone: CreateMilestoneData) => milestonesService.create(supabase, milestone),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [...MILESTONES_KEY, data.projectId] })
      queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, data.projectId] })
    },
  })
}

export function useUpdateMilestone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      projectId,
      updates,
    }: {
      id: string
      projectId: string
      updates: UpdateMilestoneData
    }) => milestonesService.update(supabase, id, updates),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: [...MILESTONES_KEY, projectId] })
      queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, projectId] })
    },
  })
}

export function useDeleteMilestone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
      milestonesService.delete(supabase, id),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: [...MILESTONES_KEY, projectId] })
      queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, projectId] })
    },
  })
}

export function useCompleteMilestone() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, projectId }: { id: string; projectId: string }) =>
      milestonesService.complete(supabase, id),
    onMutate: async ({ id, projectId }) => {
      await queryClient.cancelQueries({ queryKey: [...MILESTONES_KEY, projectId] })

      const previousMilestones = queryClient.getQueryData<Milestone[]>([
        ...MILESTONES_KEY,
        projectId,
      ])

      if (previousMilestones) {
        queryClient.setQueryData(
          [...MILESTONES_KEY, projectId],
          previousMilestones.map((m) =>
            m.id === id
              ? { ...m, status: 'completed' as MilestoneStatus, completedAt: new Date().toISOString() }
              : m
          )
        )
      }

      return { previousMilestones }
    },
    onError: (err, { projectId }, context) => {
      if (context?.previousMilestones) {
        queryClient.setQueryData([...MILESTONES_KEY, projectId], context.previousMilestones)
      }
    },
    onSettled: (_, __, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: [...MILESTONES_KEY, projectId] })
      queryClient.invalidateQueries({ queryKey: [...PROJECTS_KEY, projectId] })
    },
  })
}

// Re-export types
export type {
  Project,
  ProjectWithProgress,
  ProjectStatus,
  Objective,
  ObjectiveStatus,
  Milestone,
  MilestoneStatus,
  CreateProjectData,
  UpdateProjectData,
  CreateObjectiveData,
  UpdateObjectiveData,
  CreateMilestoneData,
  UpdateMilestoneData,
}
