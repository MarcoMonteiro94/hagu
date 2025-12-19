'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { areasService, metricsService } from '@/services/areas.service'
import type { LifeArea, MetricEntry } from '@/types'

// Query keys
export const areasKeys = {
  all: ['areas'] as const,
  lists: () => [...areasKeys.all, 'list'] as const,
  list: () => [...areasKeys.lists()] as const,
  details: () => [...areasKeys.all, 'detail'] as const,
  detail: (id: string) => [...areasKeys.details(), id] as const,
  bySlug: (slug: string) => [...areasKeys.all, 'slug', slug] as const,
}

export const metricsKeys = {
  all: ['metrics'] as const,
  byArea: (areaId: string) => [...metricsKeys.all, 'area', areaId] as const,
  byAreaAndType: (areaId: string, type: string) =>
    [...metricsKeys.all, 'area', areaId, 'type', type] as const,
}

// Areas Hooks

export function useAreas() {
  const supabase = createClient()

  return useQuery({
    queryKey: areasKeys.list(),
    queryFn: () => areasService.getAll(supabase),
  })
}

export function useOrderedAreas() {
  const { data: areas, ...rest } = useAreas()

  return {
    ...rest,
    data: areas ? [...areas].sort((a, b) => a.order - b.order) : undefined,
  }
}

export function useArea(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: areasKeys.detail(id),
    queryFn: () => areasService.getById(supabase, id),
    enabled: !!id,
  })
}

export function useAreaBySlug(slug: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: areasKeys.bySlug(slug),
    queryFn: () => areasService.getBySlug(supabase, slug),
    enabled: !!slug,
  })
}

export function useCreateArea() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (area: Omit<LifeArea, 'id' | 'createdAt' | 'isDefault' | 'order'>) =>
      areasService.create(supabase, area),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: areasKeys.lists() })
    },
  })
}

export function useUpdateArea() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Omit<LifeArea, 'id' | 'createdAt' | 'isDefault'>>
    }) => areasService.update(supabase, id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: areasKeys.lists() })
      queryClient.invalidateQueries({ queryKey: areasKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: areasKeys.bySlug(data.slug) })
    },
  })
}

export function useDeleteArea() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => areasService.delete(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: areasKeys.lists() })
    },
  })
}

export function useReorderAreas() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderedIds: string[]) => areasService.reorder(supabase, orderedIds),
    onMutate: async (orderedIds) => {
      // Cancel outgoing fetches
      await queryClient.cancelQueries({ queryKey: areasKeys.lists() })

      // Snapshot previous value
      const previousAreas = queryClient.getQueryData<LifeArea[]>(areasKeys.list())

      // Optimistically update
      if (previousAreas) {
        const updatedAreas = previousAreas.map((area) => ({
          ...area,
          order: orderedIds.indexOf(area.id),
        }))
        queryClient.setQueryData(areasKeys.list(), updatedAreas)
      }

      return { previousAreas }
    },
    onError: (_err, _orderedIds, context) => {
      // Rollback on error
      if (context?.previousAreas) {
        queryClient.setQueryData(areasKeys.list(), context.previousAreas)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: areasKeys.lists() })
    },
  })
}

// Metrics Hooks

export function useMetricsByArea(areaId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: metricsKeys.byArea(areaId),
    queryFn: () => metricsService.getByArea(supabase, areaId),
    enabled: !!areaId,
  })
}

export function useMetricsByType(areaId: string, type: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: metricsKeys.byAreaAndType(areaId, type),
    queryFn: () => metricsService.getByAreaAndType(supabase, areaId, type),
    enabled: !!areaId && !!type,
  })
}

export function useCreateMetric() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (metric: Omit<MetricEntry, 'id' | 'createdAt'>) =>
      metricsService.create(supabase, metric),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: metricsKeys.byArea(data.areaId) })
    },
  })
}

export function useUpdateMetric() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Omit<MetricEntry, 'id' | 'createdAt'>>
      areaId: string
    }) => metricsService.update(supabase, id, updates),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: metricsKeys.byArea(variables.areaId) })
    },
  })
}

export function useDeleteMetric() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, areaId }: { id: string; areaId: string }) =>
      metricsService.delete(supabase, id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: metricsKeys.byArea(variables.areaId) })
    },
  })
}
