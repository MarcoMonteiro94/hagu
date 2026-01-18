import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { areasService } from '@hagu/core'
import type { LifeArea } from '@hagu/core'
import { supabase } from '@/lib/supabase'

const AREAS_KEY = ['areas']

export function useAreasQuery() {
  return useQuery({
    queryKey: AREAS_KEY,
    queryFn: () => areasService.getAll(supabase),
  })
}

export function useAreaQuery(id: string | undefined) {
  return useQuery({
    queryKey: [...AREAS_KEY, id],
    queryFn: () => (id ? areasService.getById(supabase, id) : null),
    enabled: !!id,
  })
}

export function useAreaBySlugQuery(slug: string | undefined) {
  return useQuery({
    queryKey: [...AREAS_KEY, 'slug', slug],
    queryFn: () => (slug ? areasService.getBySlug(supabase, slug) : null),
    enabled: !!slug,
  })
}

export function useCreateArea() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (area: Omit<LifeArea, 'id' | 'createdAt' | 'isDefault' | 'order'>) =>
      areasService.create(supabase, area),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AREAS_KEY })
    },
  })
}

export function useUpdateArea() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Omit<LifeArea, 'id' | 'createdAt' | 'isDefault'>>
    }) => areasService.update(supabase, id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AREAS_KEY })
    },
  })
}

export function useDeleteArea() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => areasService.delete(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AREAS_KEY })
    },
  })
}

export function useReorderAreas() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderedIds: string[]) => areasService.reorder(supabase, orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AREAS_KEY })
    },
  })
}
