'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { notebooksService } from '@/services/notebooks.service'
import type {
  Notebook,
  NotebookWithPageCount,
  NotebookPage,
  NotebookPageSummary,
  CreateNotebookData,
  UpdateNotebookData,
  CreatePageData,
  UpdatePageData,
} from '@/types'
import { toast } from 'sonner'

// Query keys
export const notebookKeys = {
  all: ['notebooks'] as const,
  lists: () => [...notebookKeys.all, 'list'] as const,
  list: () => [...notebookKeys.lists()] as const,
  listWithCount: () => [...notebookKeys.all, 'list-with-count'] as const,
  details: () => [...notebookKeys.all, 'detail'] as const,
  detail: (id: string) => [...notebookKeys.details(), id] as const,
  pages: (notebookId: string) => [...notebookKeys.all, 'pages', notebookId] as const,
  page: (id: string) => [...notebookKeys.all, 'page', id] as const,
}

// =====================================================
// NOTEBOOKS QUERIES
// =====================================================

export function useNotebooks() {
  const supabase = createClient()

  return useQuery<Notebook[]>({
    queryKey: notebookKeys.list(),
    queryFn: () => notebooksService.getAll(supabase),
  })
}

export function useNotebooksWithPageCount() {
  const supabase = createClient()

  return useQuery<NotebookWithPageCount[]>({
    queryKey: notebookKeys.listWithCount(),
    queryFn: () => notebooksService.getAllWithPageCount(supabase),
  })
}

export function useNotebook(id: string) {
  const supabase = createClient()

  return useQuery<Notebook | null>({
    queryKey: notebookKeys.detail(id),
    queryFn: () => notebooksService.getById(supabase, id),
    enabled: !!id,
  })
}

// =====================================================
// NOTEBOOKS MUTATIONS
// =====================================================

export function useCreateNotebook() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: (data: CreateNotebookData) => notebooksService.create(supabase, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notebookKeys.lists() })
      queryClient.invalidateQueries({ queryKey: notebookKeys.listWithCount() })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateNotebook() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNotebookData }) =>
      notebooksService.update(supabase, id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: notebookKeys.lists() })
      queryClient.invalidateQueries({ queryKey: notebookKeys.listWithCount() })
      queryClient.invalidateQueries({ queryKey: notebookKeys.detail(id) })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteNotebook() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: (id: string) => notebooksService.delete(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notebookKeys.lists() })
      queryClient.invalidateQueries({ queryKey: notebookKeys.listWithCount() })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useReorderNotebooks() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: (orderedIds: string[]) => notebooksService.reorder(supabase, orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notebookKeys.lists() })
      queryClient.invalidateQueries({ queryKey: notebookKeys.listWithCount() })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

// =====================================================
// PAGES QUERIES
// =====================================================

export function usePages(notebookId: string) {
  const supabase = createClient()

  return useQuery<NotebookPageSummary[]>({
    queryKey: notebookKeys.pages(notebookId),
    queryFn: () => notebooksService.getPages(supabase, notebookId),
    enabled: !!notebookId,
  })
}

export function usePage(id: string) {
  const supabase = createClient()

  return useQuery<NotebookPage | null>({
    queryKey: notebookKeys.page(id),
    queryFn: () => notebooksService.getPage(supabase, id),
    enabled: !!id,
  })
}

// =====================================================
// PAGES MUTATIONS
// =====================================================

export function useCreatePage() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: (data: CreatePageData) => notebooksService.createPage(supabase, data),
    onSuccess: (_, { notebookId }) => {
      queryClient.invalidateQueries({ queryKey: notebookKeys.pages(notebookId) })
      queryClient.invalidateQueries({ queryKey: notebookKeys.listWithCount() })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdatePage() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
      notebookId,
    }: {
      id: string
      data: UpdatePageData
      notebookId: string
    }) => notebooksService.updatePage(supabase, id, data),
    onSuccess: (_, { id, notebookId }) => {
      queryClient.invalidateQueries({ queryKey: notebookKeys.page(id) })
      queryClient.invalidateQueries({ queryKey: notebookKeys.pages(notebookId) })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeletePage() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: ({ id, notebookId }: { id: string; notebookId: string }) =>
      notebooksService.deletePage(supabase, id),
    onSuccess: (_, { notebookId }) => {
      queryClient.invalidateQueries({ queryKey: notebookKeys.pages(notebookId) })
      queryClient.invalidateQueries({ queryKey: notebookKeys.listWithCount() })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useReorderPages() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: ({
      notebookId,
      orderedIds,
    }: {
      notebookId: string
      orderedIds: string[]
    }) => notebooksService.reorderPages(supabase, notebookId, orderedIds),
    onSuccess: (_, { notebookId }) => {
      queryClient.invalidateQueries({ queryKey: notebookKeys.pages(notebookId) })
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
