import type { SupabaseClient } from '@supabase/supabase-js'
import type { LifeArea, MetricEntry } from '@/types'

// Database row types (matching Supabase schema)
interface DbLifeArea {
  id: string
  user_id: string
  name: string
  slug: string
  color: string
  icon: string
  is_default: boolean
  order: number
  created_at: string
}

interface DbMetricEntry {
  id: string
  user_id: string
  area_id: string
  type: string
  value: number
  unit: string | null
  date: string
  created_at: string
}

// Transform database row to frontend type
function toLifeArea(row: DbLifeArea): LifeArea {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    color: row.color,
    icon: row.icon,
    isDefault: row.is_default,
    order: row.order,
    createdAt: row.created_at,
  }
}

export const areasService = {
  async getAll(supabase: SupabaseClient): Promise<LifeArea[]> {
    const { data, error } = await supabase
      .from('life_areas')
      .select('*')
      .order('order', { ascending: true })

    if (error) throw error
    return ((data ?? []) as DbLifeArea[]).map(toLifeArea)
  },

  async getById(supabase: SupabaseClient, id: string): Promise<LifeArea | null> {
    const { data, error } = await supabase
      .from('life_areas')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return toLifeArea(data as DbLifeArea)
  },

  async getBySlug(supabase: SupabaseClient, slug: string): Promise<LifeArea | null> {
    const { data, error } = await supabase
      .from('life_areas')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }
    return toLifeArea(data as DbLifeArea)
  },

  async create(
    supabase: SupabaseClient,
    area: Omit<LifeArea, 'id' | 'createdAt' | 'isDefault' | 'order'>
  ): Promise<LifeArea> {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get max order by fetching all areas and finding the max
    const existingAreas = await this.getAll(supabase)
    const maxOrder = existingAreas.length > 0
      ? Math.max(...existingAreas.map((a) => a.order))
      : -1

    const { data, error } = await supabase
      .from('life_areas')
      .insert({
        user_id: user.id,
        name: area.name,
        slug: area.slug,
        color: area.color,
        icon: area.icon,
        is_default: false,
        order: maxOrder + 1,
      })
      .select()
      .single()

    if (error) throw error
    return toLifeArea(data as DbLifeArea)
  },

  async update(
    supabase: SupabaseClient,
    id: string,
    updates: Partial<Omit<LifeArea, 'id' | 'createdAt' | 'isDefault'>>
  ): Promise<LifeArea> {
    const dbUpdates: Record<string, unknown> = {}

    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.slug !== undefined) dbUpdates.slug = updates.slug
    if (updates.color !== undefined) dbUpdates.color = updates.color
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon
    if (updates.order !== undefined) dbUpdates.order = updates.order

    const { data, error } = await supabase
      .from('life_areas')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return toLifeArea(data as DbLifeArea)
  },

  async delete(supabase: SupabaseClient, id: string): Promise<void> {
    // First check if it's a default area
    const area = await this.getById(supabase, id)
    if (area?.isDefault) {
      throw new Error('Cannot delete default area')
    }

    const { error } = await supabase
      .from('life_areas')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async reorder(supabase: SupabaseClient, orderedIds: string[]): Promise<void> {
    // Update each area's order based on position in array
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await supabase
        .from('life_areas')
        .update({ order: i })
        .eq('id', orderedIds[i])

      if (error) throw error
    }
  },
}

// Metrics service (related to areas)
export const metricsService = {
  async getByArea(supabase: SupabaseClient, areaId: string): Promise<MetricEntry[]> {
    const { data, error } = await supabase
      .from('metric_entries')
      .select('*')
      .eq('area_id', areaId)
      .order('date', { ascending: true })

    if (error) throw error

    return ((data ?? []) as DbMetricEntry[]).map((row) => ({
      id: row.id,
      areaId: row.area_id,
      type: row.type,
      value: row.value,
      unit: row.unit ?? undefined,
      date: row.date,
      createdAt: row.created_at,
    }))
  },

  async getByAreaAndType(
    supabase: SupabaseClient,
    areaId: string,
    type: string
  ): Promise<MetricEntry[]> {
    const { data, error } = await supabase
      .from('metric_entries')
      .select('*')
      .eq('area_id', areaId)
      .eq('type', type)
      .order('date', { ascending: true })

    if (error) throw error

    return ((data ?? []) as DbMetricEntry[]).map((row) => ({
      id: row.id,
      areaId: row.area_id,
      type: row.type,
      value: row.value,
      unit: row.unit ?? undefined,
      date: row.date,
      createdAt: row.created_at,
    }))
  },

  async create(
    supabase: SupabaseClient,
    metric: Omit<MetricEntry, 'id' | 'createdAt'>
  ): Promise<MetricEntry> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('metric_entries')
      .insert({
        user_id: user.id,
        area_id: metric.areaId,
        type: metric.type,
        value: metric.value,
        unit: metric.unit,
        date: metric.date,
      })
      .select()
      .single()

    if (error) throw error

    const row = data as DbMetricEntry
    return {
      id: row.id,
      areaId: row.area_id,
      type: row.type,
      value: row.value,
      unit: row.unit ?? undefined,
      date: row.date,
      createdAt: row.created_at,
    }
  },

  async update(
    supabase: SupabaseClient,
    id: string,
    updates: Partial<Omit<MetricEntry, 'id' | 'createdAt'>>
  ): Promise<MetricEntry> {
    const dbUpdates: Record<string, unknown> = {}

    if (updates.areaId !== undefined) dbUpdates.area_id = updates.areaId
    if (updates.type !== undefined) dbUpdates.type = updates.type
    if (updates.value !== undefined) dbUpdates.value = updates.value
    if (updates.unit !== undefined) dbUpdates.unit = updates.unit
    if (updates.date !== undefined) dbUpdates.date = updates.date

    const { data, error } = await supabase
      .from('metric_entries')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    const row = data as DbMetricEntry
    return {
      id: row.id,
      areaId: row.area_id,
      type: row.type,
      value: row.value,
      unit: row.unit ?? undefined,
      date: row.date,
      createdAt: row.created_at,
    }
  },

  async delete(supabase: SupabaseClient, id: string): Promise<void> {
    const { error } = await supabase
      .from('metric_entries')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
