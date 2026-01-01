// Notebooks Service - CRUD operations for notebooks and pages

import type { SupabaseClient } from '@supabase/supabase-js'
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
import type { Block } from '@blocknote/core'

// Database row types
interface DbNotebook {
  id: string
  user_id: string
  title: string
  description: string | null
  color: string
  icon: string | null
  order: number
  created_at: string
  updated_at: string
}

interface DbNotebookPage {
  id: string
  notebook_id: string
  user_id: string
  title: string
  content: unknown
  order: number
  created_at: string
  updated_at: string
}

// Transform database row to frontend type
function toNotebook(row: DbNotebook): Notebook {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description ?? undefined,
    color: row.color,
    icon: row.icon ?? undefined,
    order: row.order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toNotebookPage(row: DbNotebookPage): NotebookPage {
  return {
    id: row.id,
    notebookId: row.notebook_id,
    userId: row.user_id,
    title: row.title,
    content: (row.content as Block[]) || [],
    order: row.order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toNotebookPageSummary(row: Pick<DbNotebookPage, 'id' | 'notebook_id' | 'title' | 'order' | 'created_at' | 'updated_at'>): NotebookPageSummary {
  return {
    id: row.id,
    notebookId: row.notebook_id,
    title: row.title,
    order: row.order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const notebooksService = {
  // =====================================================
  // NOTEBOOKS
  // =====================================================

  async getAll(supabase: SupabaseClient): Promise<Notebook[]> {
    const { data, error } = await supabase
      .from('notebooks')
      .select('*')
      .order('order', { ascending: true })

    if (error) throw error

    return ((data ?? []) as DbNotebook[]).map(toNotebook)
  },

  async getAllWithPageCount(supabase: SupabaseClient): Promise<NotebookWithPageCount[]> {
    const { data, error } = await supabase
      .from('notebooks')
      .select(`
        *,
        notebook_pages(count)
      `)
      .order('order', { ascending: true })

    if (error) throw error

    type NotebookWithCount = DbNotebook & { notebook_pages: { count: number }[] }

    return ((data ?? []) as NotebookWithCount[]).map((notebook) => ({
      ...toNotebook(notebook),
      pageCount: notebook.notebook_pages?.[0]?.count ?? 0,
    }))
  },

  async getById(supabase: SupabaseClient, id: string): Promise<Notebook | null> {
    const { data, error } = await supabase
      .from('notebooks')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return toNotebook(data as DbNotebook)
  },

  async create(supabase: SupabaseClient, input: CreateNotebookData): Promise<Notebook> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get max order for new notebook
    const { data: maxOrderData } = await supabase
      .from('notebooks')
      .select('order')
      .order('order', { ascending: false })
      .limit(1)
      .single()

    const maxOrder = ((maxOrderData as { order: number } | null)?.order) ?? -1

    const { data, error } = await supabase
      .from('notebooks')
      .insert({
        user_id: user.id,
        title: input.title,
        description: input.description ?? null,
        color: input.color || '#6366f1',
        icon: input.icon ?? null,
        order: maxOrder + 1,
      })
      .select()
      .single()

    if (error) throw error

    return toNotebook(data as DbNotebook)
  },

  async update(supabase: SupabaseClient, id: string, input: UpdateNotebookData): Promise<Notebook> {
    const updateData: Record<string, unknown> = {}
    if (input.title !== undefined) updateData.title = input.title
    if (input.description !== undefined) updateData.description = input.description ?? null
    if (input.color !== undefined) updateData.color = input.color
    if (input.icon !== undefined) updateData.icon = input.icon ?? null
    if (input.order !== undefined) updateData.order = input.order

    const { data, error } = await supabase
      .from('notebooks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return toNotebook(data as DbNotebook)
  },

  async delete(supabase: SupabaseClient, id: string): Promise<void> {
    const { error } = await supabase
      .from('notebooks')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async reorder(supabase: SupabaseClient, orderedIds: string[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await supabase
        .from('notebooks')
        .update({ order: i })
        .eq('id', orderedIds[i])

      if (error) throw error
    }
  },

  // =====================================================
  // NOTEBOOK PAGES
  // =====================================================

  async getPages(supabase: SupabaseClient, notebookId: string): Promise<NotebookPageSummary[]> {
    const { data, error } = await supabase
      .from('notebook_pages')
      .select('id, notebook_id, title, order, created_at, updated_at')
      .eq('notebook_id', notebookId)
      .order('order', { ascending: true })

    if (error) throw error

    type PageSummaryRow = Pick<DbNotebookPage, 'id' | 'notebook_id' | 'title' | 'order' | 'created_at' | 'updated_at'>

    return ((data ?? []) as PageSummaryRow[]).map(toNotebookPageSummary)
  },

  async getPage(supabase: SupabaseClient, id: string): Promise<NotebookPage | null> {
    const { data, error } = await supabase
      .from('notebook_pages')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return toNotebookPage(data as DbNotebookPage)
  },

  async createPage(supabase: SupabaseClient, input: CreatePageData): Promise<NotebookPage> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get max order for new page
    const { data: maxOrderData } = await supabase
      .from('notebook_pages')
      .select('order')
      .eq('notebook_id', input.notebookId)
      .order('order', { ascending: false })
      .limit(1)
      .single()

    const maxOrder = ((maxOrderData as { order: number } | null)?.order) ?? -1

    const { data, error } = await supabase
      .from('notebook_pages')
      .insert({
        user_id: user.id,
        notebook_id: input.notebookId,
        title: input.title,
        content: input.content || [],
        order: maxOrder + 1,
      })
      .select()
      .single()

    if (error) throw error

    return toNotebookPage(data as DbNotebookPage)
  },

  async updatePage(supabase: SupabaseClient, id: string, input: UpdatePageData): Promise<NotebookPage> {
    const updateData: Record<string, unknown> = {}
    if (input.title !== undefined) updateData.title = input.title
    if (input.content !== undefined) updateData.content = input.content
    if (input.order !== undefined) updateData.order = input.order

    const { data, error } = await supabase
      .from('notebook_pages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return toNotebookPage(data as DbNotebookPage)
  },

  async deletePage(supabase: SupabaseClient, id: string): Promise<void> {
    const { error } = await supabase
      .from('notebook_pages')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async reorderPages(supabase: SupabaseClient, notebookId: string, orderedIds: string[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await supabase
        .from('notebook_pages')
        .update({ order: i })
        .eq('id', orderedIds[i])
        .eq('notebook_id', notebookId)

      if (error) throw error
    }
  },
}
