import type { SupabaseClient } from '@supabase/supabase-js'
import type { Project } from '@/types'

// Database row type
interface DbProject {
  id: string
  user_id: string
  area_id: string | null
  title: string
  description: string | null
  color: string | null
  created_at: string
  archived_at: string | null
}

// Transform database row to frontend type
function toProject(row: DbProject): Project {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    areaId: row.area_id ?? undefined,
    color: row.color ?? undefined,
    createdAt: row.created_at,
    archivedAt: row.archived_at ?? undefined,
  }
}

export const projectsService = {
  async getAll(supabase: SupabaseClient): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return ((data ?? []) as DbProject[]).map(toProject)
  },

  async getActive(supabase: SupabaseClient): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .is('archived_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return ((data ?? []) as DbProject[]).map(toProject)
  },

  async getArchived(supabase: SupabaseClient): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .not('archived_at', 'is', null)
      .order('archived_at', { ascending: false })

    if (error) throw error
    return ((data ?? []) as DbProject[]).map(toProject)
  },

  async getById(supabase: SupabaseClient, id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return toProject(data as DbProject)
  },

  async getByArea(supabase: SupabaseClient, areaId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('area_id', areaId)
      .is('archived_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return ((data ?? []) as DbProject[]).map(toProject)
  },

  async create(
    supabase: SupabaseClient,
    project: Omit<Project, 'id' | 'createdAt'>
  ): Promise<Project> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        area_id: project.areaId || null,
        title: project.title,
        description: project.description,
        color: project.color,
      })
      .select()
      .single()

    if (error) throw error

    return toProject(data as DbProject)
  },

  async update(
    supabase: SupabaseClient,
    id: string,
    updates: Partial<Omit<Project, 'id' | 'createdAt'>>
  ): Promise<Project> {
    const dbUpdates: Record<string, unknown> = {}

    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.areaId !== undefined) dbUpdates.area_id = updates.areaId || null
    if (updates.color !== undefined) dbUpdates.color = updates.color
    if (updates.archivedAt !== undefined) dbUpdates.archived_at = updates.archivedAt

    const { data, error } = await supabase
      .from('projects')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return toProject(data as DbProject)
  },

  async delete(supabase: SupabaseClient, id: string): Promise<void> {
    // First, remove project reference from all tasks
    await supabase
      .from('tasks')
      .update({ project_id: null })
      .eq('project_id', id)

    // Then delete the project
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) throw error
  },

  async archive(supabase: SupabaseClient, id: string): Promise<Project> {
    return this.update(supabase, id, { archivedAt: new Date().toISOString() })
  },

  async unarchive(supabase: SupabaseClient, id: string): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update({ archived_at: null })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return toProject(data as DbProject)
  },
}
