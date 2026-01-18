import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notebooksService, NOTEBOOK_COLORS } from '@hagu/core'
import type {
  NotebookWithPageCount,
  NotebookPage,
  NotebookPageSummary,
  CreateNotebookData as CoreCreateNotebookData,
  UpdateNotebookData as CoreUpdateNotebookData,
  UpdatePageData,
  NotebookContent,
} from '@hagu/core'
import { supabase } from '@/lib/supabase'

// =============================================================================
// Re-export types for convenience
// =============================================================================

// Re-export with aliases for backwards compatibility
export type Notebook = NotebookWithPageCount & { noteCount: number }
export { NOTEBOOK_COLORS }

// Re-export types with backwards compatible names
export type CreateNotebookData = CoreCreateNotebookData
export type UpdateNotebookData = CoreUpdateNotebookData

export interface CreateNoteData {
  notebookId: string
  title: string
  content?: string
}

export interface UpdateNoteData {
  title?: string
  content?: string
  isPinned?: boolean
}

// Note type for mobile - adapted from NotebookPage
// Note: isPinned is local-only (not persisted to database)
export interface Note {
  id: string
  notebookId: string
  title: string
  content: string // Text representation of content for display
  rawContent: NotebookContent // Original BlockNote content
  createdAt: string
  updatedAt: string
  isPinned: boolean // Local-only, not persisted
}

// =============================================================================
// Query Keys
// =============================================================================

const QUERY_KEYS = {
  notebooks: ['notes', 'notebooks'],
  pages: ['notes', 'pages'],
}

// =============================================================================
// Helpers
// =============================================================================

// Extract plain text from BlockNote content for display/search
function extractTextFromContent(content: NotebookContent): string {
  if (!content || !Array.isArray(content)) return ''

  try {
    // BlockNote content is an array of blocks
    // Each block has a 'content' array with text items
    const texts: string[] = []

    for (const block of content) {
      if (typeof block === 'object' && block !== null) {
        const blockObj = block as Record<string, unknown>

        // Handle content array (paragraphs, headings, etc.)
        if (Array.isArray(blockObj.content)) {
          for (const item of blockObj.content) {
            if (typeof item === 'object' && item !== null) {
              const itemObj = item as Record<string, unknown>
              if (typeof itemObj.text === 'string') {
                texts.push(itemObj.text)
              }
            }
          }
        }

        // Handle nested children (lists, etc.)
        if (Array.isArray(blockObj.children)) {
          const childText = extractTextFromContent(blockObj.children as NotebookContent)
          if (childText) texts.push(childText)
        }
      }
    }

    return texts.join(' ').trim()
  } catch {
    return ''
  }
}

// Convert NotebookPage to Note for mobile compatibility
function toNote(page: NotebookPage | NotebookPageSummary): Note {
  const rawContent = 'content' in page ? page.content : []
  return {
    id: page.id,
    notebookId: page.notebookId,
    title: page.title,
    content: extractTextFromContent(rawContent),
    rawContent,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
    isPinned: false, // Not persisted in database
  }
}

// =============================================================================
// Hooks - Notebooks
// =============================================================================

export function useNotebooksQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.notebooks,
    queryFn: async () => {
      const notebooks = await notebooksService.getAllWithPageCount(supabase)
      // Map pageCount to noteCount for backwards compatibility
      return notebooks.map(nb => ({
        ...nb,
        noteCount: nb.pageCount,
      }))
    },
    staleTime: 1000 * 60, // 1 minute
  })
}

export function useNotebookQuery(id: string) {
  const { data: notebooks } = useNotebooksQuery()

  return useMemo(() => {
    return notebooks?.find(nb => nb.id === id) || null
  }, [notebooks, id])
}

export function useCreateNotebook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateNotebookData) => {
      const notebook = await notebooksService.create(supabase, data)
      return {
        ...notebook,
        noteCount: 0,
        pageCount: 0,
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notebooks })
    },
  })
}

export function useUpdateNotebook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateNotebookData }) => {
      return notebooksService.update(supabase, id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notebooks })
    },
  })
}

export function useDeleteNotebook() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await notebooksService.delete(supabase, id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notebooks })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pages })
    },
  })
}

// =============================================================================
// Hooks - Notes (Pages)
// =============================================================================

export function useNotesQuery(notebookId?: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.pages, notebookId],
    queryFn: async () => {
      if (!notebookId) return []

      const pages = await notebooksService.getPages(supabase, notebookId)
      return pages.map(toNote)
    },
    staleTime: 1000 * 60, // 1 minute
    enabled: !!notebookId,
  })
}

export function useNoteQuery(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.pages, 'single', id],
    queryFn: async () => {
      const page = await notebooksService.getPage(supabase, id)
      if (!page) return null
      return toNote(page)
    },
    staleTime: 1000 * 30, // 30 seconds
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { notebookId: string; title: string; content?: string }) => {
      // Convert string content to BlockNote format
      const blockContent: NotebookContent = data.content
        ? [{ type: 'paragraph', content: [{ type: 'text', text: data.content }] }]
        : []

      const page = await notebooksService.createPage(supabase, {
        notebookId: data.notebookId,
        title: data.title,
        content: blockContent,
      })

      return toNote(page)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pages })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notebooks })
    },
  })
}

export function useUpdateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { title?: string; content?: string } }) => {
      const updateData: UpdatePageData = {}

      if (data.title !== undefined) {
        updateData.title = data.title
      }

      if (data.content !== undefined) {
        // Convert string content to BlockNote format
        updateData.content = [{ type: 'paragraph', content: [{ type: 'text', text: data.content }] }]
      }

      const page = await notebooksService.updatePage(supabase, id, updateData)
      return toNote(page)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pages })
    },
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await notebooksService.deletePage(supabase, id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.pages })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notebooks })
    },
  })
}

// Note: isPinned is not persisted to database, so this is a no-op
// In a future version, we could add a local storage layer for pinned state
export function useToggleNotePin() {
  return useMutation({
    mutationFn: async (_id: string) => {
      // No-op: isPinned is not in database schema
      console.warn('Note pinning is not persisted to database')
      return null
    },
  })
}

// =============================================================================
// Search Hook
// =============================================================================

// Hook to fetch all pages across all notebooks for search
function useAllPagesQuery() {
  const { data: notebooks = [] } = useNotebooksQuery()
  const notebookIds = notebooks.map(nb => nb.id)

  return useQuery({
    queryKey: [...QUERY_KEYS.pages, 'all', notebookIds],
    queryFn: async () => {
      if (notebookIds.length === 0) return []

      const allPages: Note[] = []
      for (const notebookId of notebookIds) {
        const pages = await notebooksService.getPages(supabase, notebookId)
        allPages.push(...pages.map(toNote))
      }
      return allPages
    },
    staleTime: 1000 * 60, // 1 minute
    enabled: notebookIds.length > 0,
  })
}

export function useSearchNotes(query: string) {
  const { data: allNotes = [] } = useAllPagesQuery()

  return useMemo(() => {
    if (!query.trim()) return []

    const lowerQuery = query.toLowerCase()
    return allNotes.filter(
      note =>
        note.title.toLowerCase().includes(lowerQuery) ||
        note.content.toLowerCase().includes(lowerQuery)
    )
  }, [allNotes, query])
}

// =============================================================================
// Auto-save Hook
// =============================================================================

export function useAutoSaveNote(noteId: string, debounceMs: number = 1000) {
  const { mutate: updateNote } = useUpdateNote()
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null)

  const save = useCallback(
    (data: UpdateNoteData) => {
      // Clear existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      setIsSaving(true)

      // Set new timeout for debounced save
      const newTimeoutId = setTimeout(() => {
        updateNote(
          { id: noteId, data },
          {
            onSuccess: () => {
              setIsSaving(false)
              setLastSaved(new Date())
            },
            onError: () => {
              setIsSaving(false)
            },
          }
        )
      }, debounceMs)

      setTimeoutId(newTimeoutId)
    },
    [noteId, debounceMs, updateNote, timeoutId]
  )

  return { save, isSaving, lastSaved }
}
