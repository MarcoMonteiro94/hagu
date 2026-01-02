import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Project,
  ProjectStatus,
  ProjectWithProgress,
  Objective,
  ObjectiveStatus,
  Milestone,
  MilestoneStatus,
  ProjectMetric,
  ProjectMetricEntry,
  CreateProjectData,
  UpdateProjectData,
  CreateObjectiveData,
  UpdateObjectiveData,
  CreateMilestoneData,
  UpdateMilestoneData,
  CreateProjectMetricData,
  UpdateProjectMetricData,
} from '@/types'

// Database row types
interface DbProject {
  id: string
  user_id: string
  area_id: string | null
  title: string
  description: string | null
  color: string | null
  icon: string | null
  status: ProjectStatus
  due_date: string | null
  start_date: string | null
  completed_at: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

interface DbObjective {
  id: string
  project_id: string
  user_id: string
  title: string
  description: string | null
  status: ObjectiveStatus
  due_date: string | null
  order: number
  completed_at: string | null
  created_at: string
  updated_at: string
}

interface DbMilestone {
  id: string
  project_id: string
  user_id: string
  title: string
  description: string | null
  target_date: string
  status: MilestoneStatus
  completed_at: string | null
  created_at: string
  updated_at: string
}

interface DbProjectMetric {
  id: string
  project_id: string
  user_id: string
  name: string
  unit: string | null
  target_value: number | null
  current_value: number
  created_at: string
  updated_at: string
}

interface DbProjectMetricEntry {
  id: string
  metric_id: string
  user_id: string
  value: number
  date: string
  created_at: string
}

// Transform functions
function toProject(row: DbProject): Project {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    areaId: row.area_id ?? undefined,
    color: row.color ?? undefined,
    icon: row.icon ?? undefined,
    status: row.status,
    dueDate: row.due_date ?? undefined,
    startDate: row.start_date ?? undefined,
    completedAt: row.completed_at ?? undefined,
    archivedAt: row.archived_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toObjective(row: DbObjective): Objective {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status,
    order: row.order,
    dueDate: row.due_date ?? undefined,
    completedAt: row.completed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toMilestone(row: DbMilestone): Milestone {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description ?? undefined,
    targetDate: row.target_date,
    status: row.status,
    completedAt: row.completed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toProjectMetric(row: DbProjectMetric): ProjectMetric {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    unit: row.unit ?? undefined,
    targetValue: row.target_value ?? undefined,
    currentValue: row.current_value,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toProjectMetricEntry(row: DbProjectMetricEntry): ProjectMetricEntry {
  return {
    id: row.id,
    metricId: row.metric_id,
    value: row.value,
    date: row.date,
    createdAt: row.created_at,
  }
}

function calculateProgress(objectives: Objective[]): number {
  if (objectives.length === 0) return 0
  const completed = objectives.filter((o) => o.status === 'completed').length
  return Math.round((completed / objectives.length) * 100)
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
      .in('status', ['active', 'paused'])
      .order('created_at', { ascending: false })

    if (error) throw error
    return ((data ?? []) as DbProject[]).map(toProject)
  },

  async getByStatus(supabase: SupabaseClient, status: ProjectStatus): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) throw error
    return ((data ?? []) as DbProject[]).map(toProject)
  },

  async getArchived(supabase: SupabaseClient): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('status', 'archived')
      .order('updated_at', { ascending: false })

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

  async getByIdWithProgress(
    supabase: SupabaseClient,
    id: string
  ): Promise<ProjectWithProgress | null> {
    const project = await this.getById(supabase, id)
    if (!project) return null

    const objectives = await objectivesService.getByProject(supabase, id)
    const milestones = await milestonesService.getByProject(supabase, id)

    // Get tasks count for this project
    const { count: tasksCount, error: tasksCountError } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', id)

    if (tasksCountError) throw tasksCountError

    // Get completed tasks count
    const { count: completedTasksCount, error: completedTasksCountError } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', id)
      .eq('status', 'done')

    if (completedTasksCountError) throw completedTasksCountError

    // Get habits count for this project
    const { count: habitsCount, error: habitsCountError } = await supabase
      .from('habits')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', id)
      .is('archived_at', null)

    if (habitsCountError) throw habitsCountError

    const today = new Date().toISOString().split('T')[0]
    const upcomingMilestones = milestones
      .filter((m) => m.status !== 'completed' && m.targetDate >= today)
      .sort((a, b) => a.targetDate.localeCompare(b.targetDate))
      .slice(0, 3)

    return {
      ...project,
      progress: calculateProgress(objectives),
      objectivesCount: objectives.length,
      completedObjectivesCount: objectives.filter((o) => o.status === 'completed').length,
      milestonesCount: milestones.length,
      upcomingMilestones,
      tasksCount: tasksCount ?? 0,
      completedTasksCount: completedTasksCount ?? 0,
      habitsCount: habitsCount ?? 0,
    }
  },

  async getByArea(supabase: SupabaseClient, areaId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('area_id', areaId)
      .in('status', ['active', 'paused'])
      .order('created_at', { ascending: false })

    if (error) throw error
    return ((data ?? []) as DbProject[]).map(toProject)
  },

  async getAllWithProgress(supabase: SupabaseClient): Promise<ProjectWithProgress[]> {
    const projects = await this.getActive(supabase)
    if (projects.length === 0) return []

    const projectIds = projects.map((p) => p.id)

    // Get all objectives for these projects
    const { data: objectivesData, error: objectivesError } = await supabase
      .from('objectives')
      .select('*')
      .in('project_id', projectIds)

    if (objectivesError) throw objectivesError

    const objectives = ((objectivesData ?? []) as DbObjective[]).map(toObjective)
    const objectivesByProject = new Map<string, Objective[]>()
    objectives.forEach((o) => {
      const existing = objectivesByProject.get(o.projectId) ?? []
      existing.push(o)
      objectivesByProject.set(o.projectId, existing)
    })

    // Get all milestones for these projects
    const { data: milestonesData, error: milestonesError } = await supabase
      .from('milestones')
      .select('*')
      .in('project_id', projectIds)

    if (milestonesError) throw milestonesError

    const milestones = ((milestonesData ?? []) as DbMilestone[]).map(toMilestone)
    const milestonesByProject = new Map<string, Milestone[]>()
    milestones.forEach((m) => {
      const existing = milestonesByProject.get(m.projectId) ?? []
      existing.push(m)
      milestonesByProject.set(m.projectId, existing)
    })

    // Get tasks counts
    const { data: tasksCounts } = await supabase
      .from('tasks')
      .select('project_id, status')
      .in('project_id', projectIds)

    const tasksCountByProject = new Map<string, { total: number; completed: number }>()
    ;(tasksCounts ?? []).forEach((t: { project_id: string; status: string }) => {
      const existing = tasksCountByProject.get(t.project_id) ?? { total: 0, completed: 0 }
      existing.total++
      if (t.status === 'done') existing.completed++
      tasksCountByProject.set(t.project_id, existing)
    })

    // Get habits counts
    const { data: habitsCounts } = await supabase
      .from('habits')
      .select('project_id')
      .in('project_id', projectIds)
      .is('archived_at', null)

    const habitsCountByProject = new Map<string, number>()
    ;(habitsCounts ?? []).forEach((h: { project_id: string }) => {
      const existing = habitsCountByProject.get(h.project_id) ?? 0
      habitsCountByProject.set(h.project_id, existing + 1)
    })

    const today = new Date().toISOString().split('T')[0]

    return projects.map((project) => {
      const projectObjectives = objectivesByProject.get(project.id) ?? []
      const projectMilestones = milestonesByProject.get(project.id) ?? []
      const tasksCounts = tasksCountByProject.get(project.id) ?? { total: 0, completed: 0 }

      const upcomingMilestones = projectMilestones
        .filter((m) => m.status !== 'completed' && m.targetDate >= today)
        .sort((a, b) => a.targetDate.localeCompare(b.targetDate))
        .slice(0, 3)

      return {
        ...project,
        progress: calculateProgress(projectObjectives),
        objectivesCount: projectObjectives.length,
        completedObjectivesCount: projectObjectives.filter((o) => o.status === 'completed').length,
        milestonesCount: projectMilestones.length,
        upcomingMilestones,
        tasksCount: tasksCounts.total,
        completedTasksCount: tasksCounts.completed,
        habitsCount: habitsCountByProject.get(project.id) ?? 0,
      }
    })
  },

  async create(supabase: SupabaseClient, project: CreateProjectData): Promise<Project> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        title: project.title,
        description: project.description,
        color: project.color,
        icon: project.icon,
        status: 'active',
        due_date: project.dueDate,
        start_date: project.startDate ?? new Date().toISOString().split('T')[0],
      })
      .select()
      .single()

    if (error) throw error

    return toProject(data as DbProject)
  },

  async update(supabase: SupabaseClient, id: string, updates: UpdateProjectData): Promise<Project> {
    const dbUpdates: Record<string, unknown> = {}

    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.color !== undefined) dbUpdates.color = updates.color
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon
    if (updates.status !== undefined) {
      dbUpdates.status = updates.status
      if (updates.status === 'completed') {
        dbUpdates.completed_at = new Date().toISOString()
      } else if (updates.status === 'archived') {
        dbUpdates.archived_at = new Date().toISOString()
      }
    }
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate
    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate

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
    // Remove project reference from all tasks
    await supabase.from('tasks').update({ project_id: null }).eq('project_id', id)

    // Remove project reference from all habits
    await supabase.from('habits').update({ project_id: null }).eq('project_id', id)

    // Delete the project (objectives, milestones, metrics cascade delete)
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) throw error
  },

  async archive(supabase: SupabaseClient, id: string): Promise<Project> {
    return this.update(supabase, id, { status: 'archived' })
  },

  async unarchive(supabase: SupabaseClient, id: string): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update({ status: 'active', archived_at: null })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return toProject(data as DbProject)
  },

  async complete(supabase: SupabaseClient, id: string): Promise<Project> {
    return this.update(supabase, id, { status: 'completed' })
  },

  async pause(supabase: SupabaseClient, id: string): Promise<Project> {
    return this.update(supabase, id, { status: 'paused' })
  },

  async resume(supabase: SupabaseClient, id: string): Promise<Project> {
    return this.update(supabase, id, { status: 'active' })
  },
}

export const objectivesService = {
  async getByProject(supabase: SupabaseClient, projectId: string): Promise<Objective[]> {
    const { data, error } = await supabase
      .from('objectives')
      .select('*')
      .eq('project_id', projectId)
      .order('order', { ascending: true })

    if (error) throw error
    return ((data ?? []) as DbObjective[]).map(toObjective)
  },

  async getById(supabase: SupabaseClient, id: string): Promise<Objective | null> {
    const { data, error } = await supabase
      .from('objectives')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return toObjective(data as DbObjective)
  },

  async create(supabase: SupabaseClient, objective: CreateObjectiveData): Promise<Objective> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get max order
    const { data: existingObjectives } = await supabase
      .from('objectives')
      .select('order')
      .eq('project_id', objective.projectId)
      .order('order', { ascending: false })
      .limit(1)

    const maxOrder =
      existingObjectives && existingObjectives.length > 0 ? existingObjectives[0].order : -1

    const { data, error } = await supabase
      .from('objectives')
      .insert({
        project_id: objective.projectId,
        user_id: user.id,
        title: objective.title,
        description: objective.description,
        due_date: objective.dueDate,
        order: maxOrder + 1,
        status: 'pending',
      })
      .select()
      .single()

    if (error) throw error

    return toObjective(data as DbObjective)
  },

  async update(
    supabase: SupabaseClient,
    id: string,
    updates: UpdateObjectiveData
  ): Promise<Objective> {
    const dbUpdates: Record<string, unknown> = {}

    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.status !== undefined) {
      dbUpdates.status = updates.status
      if (updates.status === 'completed') {
        dbUpdates.completed_at = new Date().toISOString()
      }
    }
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate
    if (updates.order !== undefined) dbUpdates.order = updates.order

    const { data, error } = await supabase
      .from('objectives')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return toObjective(data as DbObjective)
  },

  async delete(supabase: SupabaseClient, id: string): Promise<void> {
    // Remove objective reference from tasks
    await supabase.from('tasks').update({ objective_id: null }).eq('objective_id', id)

    const { error } = await supabase.from('objectives').delete().eq('id', id)
    if (error) throw error
  },

  async complete(supabase: SupabaseClient, id: string): Promise<Objective> {
    return this.update(supabase, id, { status: 'completed' })
  },

  async reorder(supabase: SupabaseClient, orderedIds: string[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await supabase
        .from('objectives')
        .update({ order: i })
        .eq('id', orderedIds[i])

      if (error) throw error
    }
  },
}

export const milestonesService = {
  async getByProject(supabase: SupabaseClient, projectId: string): Promise<Milestone[]> {
    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('target_date', { ascending: true })

    if (error) throw error
    return ((data ?? []) as DbMilestone[]).map(toMilestone)
  },

  async getById(supabase: SupabaseClient, id: string): Promise<Milestone | null> {
    const { data, error } = await supabase.from('milestones').select('*').eq('id', id).single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return toMilestone(data as DbMilestone)
  },

  async getUpcoming(supabase: SupabaseClient, days: number = 30): Promise<Milestone[]> {
    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + days)

    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .gte('target_date', today.toISOString().split('T')[0])
      .lte('target_date', futureDate.toISOString().split('T')[0])
      .neq('status', 'completed')
      .order('target_date', { ascending: true })

    if (error) throw error
    return ((data ?? []) as DbMilestone[]).map(toMilestone)
  },

  async create(supabase: SupabaseClient, milestone: CreateMilestoneData): Promise<Milestone> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('milestones')
      .insert({
        project_id: milestone.projectId,
        user_id: user.id,
        title: milestone.title,
        description: milestone.description,
        target_date: milestone.targetDate,
        status: 'upcoming',
      })
      .select()
      .single()

    if (error) throw error

    return toMilestone(data as DbMilestone)
  },

  async update(
    supabase: SupabaseClient,
    id: string,
    updates: UpdateMilestoneData
  ): Promise<Milestone> {
    const dbUpdates: Record<string, unknown> = {}

    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.targetDate !== undefined) dbUpdates.target_date = updates.targetDate
    if (updates.status !== undefined) {
      dbUpdates.status = updates.status
      if (updates.status === 'completed') {
        dbUpdates.completed_at = new Date().toISOString()
      }
    }

    const { data, error } = await supabase
      .from('milestones')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return toMilestone(data as DbMilestone)
  },

  async delete(supabase: SupabaseClient, id: string): Promise<void> {
    const { error } = await supabase.from('milestones').delete().eq('id', id)
    if (error) throw error
  },

  async complete(supabase: SupabaseClient, id: string): Promise<Milestone> {
    return this.update(supabase, id, { status: 'completed' })
  },
}

export const projectMetricsService = {
  async getByProject(supabase: SupabaseClient, projectId: string): Promise<ProjectMetric[]> {
    const { data, error } = await supabase
      .from('project_metrics')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return ((data ?? []) as DbProjectMetric[]).map(toProjectMetric)
  },

  async getById(supabase: SupabaseClient, id: string): Promise<ProjectMetric | null> {
    const { data, error } = await supabase.from('project_metrics').select('*').eq('id', id).single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    return toProjectMetric(data as DbProjectMetric)
  },

  async create(supabase: SupabaseClient, metric: CreateProjectMetricData): Promise<ProjectMetric> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('project_metrics')
      .insert({
        project_id: metric.projectId,
        user_id: user.id,
        name: metric.name,
        unit: metric.unit,
        target_value: metric.targetValue,
        current_value: metric.currentValue ?? 0,
      })
      .select()
      .single()

    if (error) throw error

    return toProjectMetric(data as DbProjectMetric)
  },

  async update(
    supabase: SupabaseClient,
    id: string,
    updates: UpdateProjectMetricData
  ): Promise<ProjectMetric> {
    const dbUpdates: Record<string, unknown> = {}

    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.unit !== undefined) dbUpdates.unit = updates.unit
    if (updates.targetValue !== undefined) dbUpdates.target_value = updates.targetValue
    if (updates.currentValue !== undefined) dbUpdates.current_value = updates.currentValue

    const { data, error } = await supabase
      .from('project_metrics')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return toProjectMetric(data as DbProjectMetric)
  },

  async delete(supabase: SupabaseClient, id: string): Promise<void> {
    const { error } = await supabase.from('project_metrics').delete().eq('id', id)
    if (error) throw error
  },

  async updateValue(
    supabase: SupabaseClient,
    id: string,
    value: number,
    recordHistory: boolean = true
  ): Promise<ProjectMetric> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Update current value
    const { data, error } = await supabase
      .from('project_metrics')
      .update({ current_value: value })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Record history entry
    if (recordHistory) {
      await supabase.from('project_metric_entries').insert({
        metric_id: id,
        user_id: user.id,
        value,
        date: new Date().toISOString().split('T')[0],
      })
    }

    return toProjectMetric(data as DbProjectMetric)
  },

  async getHistory(
    supabase: SupabaseClient,
    metricId: string,
    days: number = 30
  ): Promise<ProjectMetricEntry[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('project_metric_entries')
      .select('*')
      .eq('metric_id', metricId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true })

    if (error) throw error
    return ((data ?? []) as DbProjectMetricEntry[]).map(toProjectMetricEntry)
  },
}
