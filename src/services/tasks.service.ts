import type { SupabaseClient } from '@supabase/supabase-js'
import type { Task, Subtask, TaskStatus, TaskPriority, RecurrencePattern } from '@/types'

// Database row types
interface DbTask {
  id: string
  user_id: string
  project_id: string | null
  area_id: string | null
  title: string
  description: string | null
  due_date: string | null
  priority: TaskPriority | null
  status: TaskStatus
  tags: string[]
  estimated_minutes: number | null
  recurrence_type: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
  recurrence_interval: number | null
  recurrence_end_date: string | null
  order: number
  created_at: string
  completed_at: string | null
}

interface DbSubtask {
  id: string
  task_id: string
  title: string
  done: boolean
  order: number
  created_at: string
}

function calculateNextDueDate(
  currentDueDate: string,
  recurrence: RecurrencePattern
): string {
  const date = new Date(currentDueDate)

  switch (recurrence.type) {
    case 'daily':
      date.setDate(date.getDate() + recurrence.interval)
      break
    case 'weekly':
      date.setDate(date.getDate() + recurrence.interval * 7)
      break
    case 'monthly':
      date.setMonth(date.getMonth() + recurrence.interval)
      break
    case 'yearly':
      date.setFullYear(date.getFullYear() + recurrence.interval)
      break
  }

  return date.toISOString().split('T')[0]
}

// Transform database row to frontend type
function toTask(row: DbTask, subtasks: Subtask[] = []): Task {
  let recurrence: RecurrencePattern | undefined
  if (row.recurrence_type && row.recurrence_interval) {
    recurrence = {
      type: row.recurrence_type,
      interval: row.recurrence_interval,
      endDate: row.recurrence_end_date ?? undefined,
    }
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    projectId: row.project_id ?? undefined,
    areaId: row.area_id ?? undefined,
    dueDate: row.due_date ?? undefined,
    priority: row.priority ?? undefined,
    status: row.status,
    tags: row.tags ?? [],
    estimatedMinutes: row.estimated_minutes ?? undefined,
    recurrence,
    subtasks,
    createdAt: row.created_at,
    completedAt: row.completed_at ?? undefined,
  }
}

function toSubtask(row: DbSubtask): Subtask {
  return {
    id: row.id,
    title: row.title,
    done: row.done,
  }
}

export const tasksService = {
  async getAll(supabase: SupabaseClient): Promise<Task[]> {
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .order('order', { ascending: true })

    if (tasksError) throw tasksError

    const tasks = (tasksData ?? []) as DbTask[]

    if (tasks.length === 0) return []

    // Get subtasks for all tasks
    const taskIds = tasks.map((t) => t.id)
    const { data: subtasksData, error: subtasksError } = await supabase
      .from('subtasks')
      .select('*')
      .in('task_id', taskIds)
      .order('order', { ascending: true })

    if (subtasksError) throw subtasksError

    const subtasks = (subtasksData ?? []) as DbSubtask[]

    // Group subtasks by task
    const subtasksByTask = new Map<string, Subtask[]>()
    subtasks.forEach((s) => {
      const existing = subtasksByTask.get(s.task_id) ?? []
      existing.push(toSubtask(s))
      subtasksByTask.set(s.task_id, existing)
    })

    return tasks.map((t) => toTask(t, subtasksByTask.get(t.id) ?? []))
  },

  async getById(supabase: SupabaseClient, id: string): Promise<Task | null> {
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single()

    if (taskError) {
      if (taskError.code === 'PGRST116') return null
      throw taskError
    }

    const { data: subtasksData } = await supabase
      .from('subtasks')
      .select('*')
      .eq('task_id', id)
      .order('order', { ascending: true })

    const subtasks = ((subtasksData ?? []) as DbSubtask[]).map(toSubtask)

    return toTask(taskData as DbTask, subtasks)
  },

  async getByProject(supabase: SupabaseClient, projectId: string): Promise<Task[]> {
    const { data: tasksData, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('order', { ascending: true })

    if (error) throw error

    const tasks = (tasksData ?? []) as DbTask[]
    if (tasks.length === 0) return []

    const taskIds = tasks.map((t) => t.id)
    const { data: subtasksData } = await supabase
      .from('subtasks')
      .select('*')
      .in('task_id', taskIds)
      .order('order', { ascending: true })

    const subtasks = (subtasksData ?? []) as DbSubtask[]
    const subtasksByTask = new Map<string, Subtask[]>()
    subtasks.forEach((s) => {
      const existing = subtasksByTask.get(s.task_id) ?? []
      existing.push(toSubtask(s))
      subtasksByTask.set(s.task_id, existing)
    })

    return tasks.map((t) => toTask(t, subtasksByTask.get(t.id) ?? []))
  },

  async getByArea(supabase: SupabaseClient, areaId: string): Promise<Task[]> {
    const { data: tasksData, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('area_id', areaId)
      .order('order', { ascending: true })

    if (error) throw error

    const tasks = (tasksData ?? []) as DbTask[]
    if (tasks.length === 0) return []

    const taskIds = tasks.map((t) => t.id)
    const { data: subtasksData } = await supabase
      .from('subtasks')
      .select('*')
      .in('task_id', taskIds)
      .order('order', { ascending: true })

    const subtasks = (subtasksData ?? []) as DbSubtask[]
    const subtasksByTask = new Map<string, Subtask[]>()
    subtasks.forEach((s) => {
      const existing = subtasksByTask.get(s.task_id) ?? []
      existing.push(toSubtask(s))
      subtasksByTask.set(s.task_id, existing)
    })

    return tasks.map((t) => toTask(t, subtasksByTask.get(t.id) ?? []))
  },

  async getByStatus(supabase: SupabaseClient, status: TaskStatus): Promise<Task[]> {
    const { data: tasksData, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('status', status)
      .order('order', { ascending: true })

    if (error) throw error

    const tasks = (tasksData ?? []) as DbTask[]
    if (tasks.length === 0) return []

    const taskIds = tasks.map((t) => t.id)
    const { data: subtasksData } = await supabase
      .from('subtasks')
      .select('*')
      .in('task_id', taskIds)
      .order('order', { ascending: true })

    const subtasks = (subtasksData ?? []) as DbSubtask[]
    const subtasksByTask = new Map<string, Subtask[]>()
    subtasks.forEach((s) => {
      const existing = subtasksByTask.get(s.task_id) ?? []
      existing.push(toSubtask(s))
      subtasksByTask.set(s.task_id, existing)
    })

    return tasks.map((t) => toTask(t, subtasksByTask.get(t.id) ?? []))
  },

  async create(
    supabase: SupabaseClient,
    task: Omit<Task, 'id' | 'createdAt' | 'subtasks'>
  ): Promise<Task> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get max order
    const { data: allTasks } = await supabase
      .from('tasks')
      .select('*')
      .order('order', { ascending: false })
      .limit(1)

    const maxOrder = allTasks && allTasks.length > 0 ? (allTasks[0] as DbTask).order : -1

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        project_id: task.projectId || null,
        area_id: task.areaId || null,
        title: task.title,
        description: task.description,
        due_date: task.dueDate,
        priority: task.priority,
        status: task.status,
        tags: task.tags,
        estimated_minutes: task.estimatedMinutes,
        recurrence_type: task.recurrence?.type,
        recurrence_interval: task.recurrence?.interval,
        recurrence_end_date: task.recurrence?.endDate,
        order: maxOrder + 1,
      })
      .select()
      .single()

    if (error) throw error

    return toTask(data as DbTask, [])
  },

  async update(
    supabase: SupabaseClient,
    id: string,
    updates: Partial<Omit<Task, 'id' | 'createdAt' | 'subtasks'>>
  ): Promise<Task> {
    const dbUpdates: Record<string, unknown> = {}

    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId || null
    if (updates.areaId !== undefined) dbUpdates.area_id = updates.areaId || null
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags
    if (updates.estimatedMinutes !== undefined) dbUpdates.estimated_minutes = updates.estimatedMinutes
    if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt

    if (updates.recurrence !== undefined) {
      if (updates.recurrence) {
        dbUpdates.recurrence_type = updates.recurrence.type
        dbUpdates.recurrence_interval = updates.recurrence.interval
        dbUpdates.recurrence_end_date = updates.recurrence.endDate
      } else {
        dbUpdates.recurrence_type = null
        dbUpdates.recurrence_interval = null
        dbUpdates.recurrence_end_date = null
      }
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    const { data: subtasksData } = await supabase
      .from('subtasks')
      .select('*')
      .eq('task_id', id)
      .order('order', { ascending: true })

    const subtasks = ((subtasksData ?? []) as DbSubtask[]).map(toSubtask)

    return toTask(data as DbTask, subtasks)
  },

  async delete(supabase: SupabaseClient, id: string): Promise<void> {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) throw error
  },

  async setStatus(
    supabase: SupabaseClient,
    id: string,
    status: TaskStatus
  ): Promise<{ task: Task; newRecurringTask?: Task }> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Get current task
    const currentTask = await this.getById(supabase, id)
    if (!currentTask) throw new Error('Task not found')

    const completedAt = status === 'done' ? new Date().toISOString() : null

    const { data, error } = await supabase
      .from('tasks')
      .update({ status, completed_at: completedAt })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    const updatedTask = toTask(data as DbTask, currentTask.subtasks)
    let newRecurringTask: Task | undefined

    // Generate next recurring task when completing a recurring task
    if (status === 'done' && currentTask.recurrence && currentTask.dueDate) {
      const nextDueDate = calculateNextDueDate(currentTask.dueDate, currentTask.recurrence)

      const shouldCreate =
        !currentTask.recurrence.endDate || nextDueDate <= currentTask.recurrence.endDate

      if (shouldCreate) {
        // Get max order
        const { data: allTasks } = await supabase
          .from('tasks')
          .select('*')
          .order('order', { ascending: false })
          .limit(1)

        const maxOrder = allTasks && allTasks.length > 0 ? (allTasks[0] as DbTask).order : -1

        const { data: newTaskData, error: newTaskError } = await supabase
          .from('tasks')
          .insert({
            user_id: user.id,
            project_id: currentTask.projectId || null,
            area_id: currentTask.areaId || null,
            title: currentTask.title,
            description: currentTask.description,
            due_date: nextDueDate,
            priority: currentTask.priority,
            status: 'pending',
            tags: currentTask.tags,
            estimated_minutes: currentTask.estimatedMinutes,
            recurrence_type: currentTask.recurrence.type,
            recurrence_interval: currentTask.recurrence.interval,
            recurrence_end_date: currentTask.recurrence.endDate,
            order: maxOrder + 1,
          })
          .select()
          .single()

        if (!newTaskError && newTaskData) {
          // Copy subtasks
          if (currentTask.subtasks.length > 0) {
            const newSubtasks = currentTask.subtasks.map((st, index) => ({
              task_id: newTaskData.id,
              title: st.title,
              done: false,
              order: index,
            }))

            await supabase.from('subtasks').insert(newSubtasks)
          }

          const { data: newSubtasksData } = await supabase
            .from('subtasks')
            .select('*')
            .eq('task_id', newTaskData.id)
            .order('order', { ascending: true })

          const subtasks = ((newSubtasksData ?? []) as DbSubtask[]).map(toSubtask)
          newRecurringTask = toTask(newTaskData as DbTask, subtasks)
        }
      }
    }

    return { task: updatedTask, newRecurringTask }
  },

  async reorder(supabase: SupabaseClient, orderedIds: string[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await supabase
        .from('tasks')
        .update({ order: i })
        .eq('id', orderedIds[i])

      if (error) throw error
    }
  },
}

// Subtasks service
export const subtasksService = {
  async add(supabase: SupabaseClient, taskId: string, title: string): Promise<Subtask> {
    // Get max order for this task's subtasks
    const { data: existingSubtasks } = await supabase
      .from('subtasks')
      .select('*')
      .eq('task_id', taskId)
      .order('order', { ascending: false })
      .limit(1)

    const maxOrder = existingSubtasks && existingSubtasks.length > 0
      ? (existingSubtasks[0] as DbSubtask).order
      : -1

    const { data, error } = await supabase
      .from('subtasks')
      .insert({
        task_id: taskId,
        title,
        done: false,
        order: maxOrder + 1,
      })
      .select()
      .single()

    if (error) throw error

    return toSubtask(data as DbSubtask)
  },

  async toggle(supabase: SupabaseClient, id: string): Promise<Subtask> {
    // Get current state
    const { data: current, error: getError } = await supabase
      .from('subtasks')
      .select('*')
      .eq('id', id)
      .single()

    if (getError) throw getError

    const { data, error } = await supabase
      .from('subtasks')
      .update({ done: !(current as DbSubtask).done })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return toSubtask(data as DbSubtask)
  },

  async delete(supabase: SupabaseClient, id: string): Promise<void> {
    const { error } = await supabase.from('subtasks').delete().eq('id', id)
    if (error) throw error
  },

  async update(supabase: SupabaseClient, id: string, title: string): Promise<Subtask> {
    const { data, error } = await supabase
      .from('subtasks')
      .update({ title })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return toSubtask(data as DbSubtask)
  },
}
