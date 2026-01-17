import { describe, it, expect, vi } from 'vitest'
import { tasksService, subtasksService } from './tasks.service'
import type { SupabaseClient } from '@supabase/supabase-js'

// Type for mock chain with all Supabase query methods
interface MockChain {
  select: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  neq: ReturnType<typeof vi.fn>
  in: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  limit: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  then: ReturnType<typeof vi.fn>
}

// Mock Supabase client factory with proper chaining support
function createMockSupabase() {
  let defaultResult: { data: unknown; error: unknown } = { data: null, error: null }
  const resultQueue: Array<{ data: unknown; error: unknown }> = []

  const mockChain = {} as MockChain

  const getNextResult = () => {
    if (resultQueue.length > 0) {
      return resultQueue.shift()!
    }
    return defaultResult
  }

  // Define all chainable methods that return mockChain
  mockChain.select = vi.fn(() => mockChain)
  mockChain.insert = vi.fn(() => mockChain)
  mockChain.update = vi.fn(() => mockChain)
  mockChain.delete = vi.fn(() => mockChain)
  mockChain.eq = vi.fn(() => mockChain)
  mockChain.neq = vi.fn(() => mockChain)
  mockChain.in = vi.fn(() => mockChain)
  mockChain.order = vi.fn(() => mockChain)
  mockChain.limit = vi.fn(() => mockChain)
  mockChain.single = vi.fn(() => mockChain)

  // Make mockChain thenable
  mockChain.then = vi.fn((resolve) => {
    const result = getNextResult()
    return Promise.resolve(result).then(resolve)
  })

  const queueResult = (result: { data?: unknown; error: unknown }) => {
    resultQueue.push({ data: result.data ?? null, error: result.error })
  }

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
    from: vi.fn(() => mockChain),
    mockChain,
    queueResult,
    setDefaultResult: (result: { data?: unknown; error: unknown }) => {
      defaultResult = { data: result.data ?? null, error: result.error }
    },
  } as unknown as SupabaseClient & {
    mockChain: MockChain
    queueResult: (result: { data?: unknown; error: unknown }) => void
    setDefaultResult: (result: { data?: unknown; error: unknown }) => void
  }
}

// Sample DB task data
const mockDbTask = {
  id: 'task-1',
  user_id: 'test-user-id',
  project_id: null,
  area_id: 'health',
  notebook_id: null,
  page_id: null,
  title: 'Complete project',
  description: 'Finish the MVP',
  due_date: '2024-01-20',
  priority: 'high' as const,
  status: 'pending' as const,
  tags: ['work', 'important'],
  estimated_minutes: 120,
  recurrence_type: null,
  recurrence_interval: null,
  recurrence_end_date: null,
  linked_transaction_id: null,
  order: 0,
  created_at: '2024-01-01T00:00:00Z',
  completed_at: null,
}

const mockDbSubtask = {
  id: 'subtask-1',
  task_id: 'task-1',
  title: 'Research',
  done: false,
  order: 0,
  created_at: '2024-01-01T00:00:00Z',
}

describe('tasksService', () => {
  describe('getAll', () => {
    it('fetches all tasks with subtasks', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [mockDbTask], error: null }) // tasks query
      mockSupabase.queueResult({ data: [mockDbSubtask], error: null }) // subtasks query

      const result = await tasksService.getAll(mockSupabase)

      expect(mockSupabase.from).toHaveBeenCalledWith('tasks')
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 'task-1',
        title: 'Complete project',
        status: 'pending',
        priority: 'high',
        areaId: 'health',
      })
      expect(result[0].subtasks).toHaveLength(1)
    })

    it('returns empty array when no tasks exist', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [], error: null })

      const result = await tasksService.getAll(mockSupabase)

      expect(result).toEqual([])
    })

    it('throws error when fetch fails', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: null, error: { message: 'Database error' } })

      await expect(tasksService.getAll(mockSupabase)).rejects.toEqual({
        message: 'Database error',
      })
    })
  })

  describe('getById', () => {
    it('fetches a task by id with subtasks', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: mockDbTask, error: null }) // task query
      mockSupabase.queueResult({ data: [mockDbSubtask], error: null }) // subtasks query

      const result = await tasksService.getById(mockSupabase, 'task-1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('task-1')
      expect(result?.title).toBe('Complete project')
      expect(result?.subtasks).toHaveLength(1)
    })

    it('returns null when task not found', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: null, error: { code: 'PGRST116', message: 'Not found' } })

      const result = await tasksService.getById(mockSupabase, 'non-existent')

      expect(result).toBeNull()
    })
  })

  describe('getByProject', () => {
    it('fetches tasks filtered by project', async () => {
      const taskWithProject = { ...mockDbTask, project_id: 'project-1' }
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [taskWithProject], error: null }) // tasks query
      mockSupabase.queueResult({ data: [], error: null }) // subtasks query

      const result = await tasksService.getByProject(mockSupabase, 'project-1')

      expect(mockSupabase.mockChain.eq).toHaveBeenCalledWith('project_id', 'project-1')
      expect(result).toHaveLength(1)
    })

    it('returns empty array when no tasks in project', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [], error: null })

      const result = await tasksService.getByProject(mockSupabase, 'empty-project')

      expect(result).toEqual([])
    })
  })

  describe('getByArea', () => {
    it('fetches tasks filtered by area', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [mockDbTask], error: null }) // tasks query
      mockSupabase.queueResult({ data: [mockDbSubtask], error: null }) // subtasks query

      const result = await tasksService.getByArea(mockSupabase, 'health')

      expect(mockSupabase.mockChain.eq).toHaveBeenCalledWith('area_id', 'health')
      expect(result).toHaveLength(1)
    })
  })

  describe('getByNotebook', () => {
    it('fetches tasks filtered by notebook', async () => {
      const taskWithNotebook = { ...mockDbTask, notebook_id: 'notebook-1' }
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [taskWithNotebook], error: null }) // tasks query
      mockSupabase.queueResult({ data: [], error: null }) // subtasks query

      const result = await tasksService.getByNotebook(mockSupabase, 'notebook-1')

      expect(mockSupabase.mockChain.eq).toHaveBeenCalledWith('notebook_id', 'notebook-1')
      expect(result).toHaveLength(1)
    })
  })

  describe('getByPage', () => {
    it('fetches tasks filtered by page', async () => {
      const taskWithPage = { ...mockDbTask, page_id: 'page-1' }
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [taskWithPage], error: null }) // tasks query
      mockSupabase.queueResult({ data: [], error: null }) // subtasks query

      const result = await tasksService.getByPage(mockSupabase, 'page-1')

      expect(mockSupabase.mockChain.eq).toHaveBeenCalledWith('page_id', 'page-1')
      expect(result).toHaveLength(1)
    })
  })

  describe('getByStatus', () => {
    it('fetches tasks filtered by status', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [mockDbTask], error: null }) // tasks query
      mockSupabase.queueResult({ data: [], error: null }) // subtasks query

      const result = await tasksService.getByStatus(mockSupabase, 'pending')

      expect(mockSupabase.mockChain.eq).toHaveBeenCalledWith('status', 'pending')
      expect(result).toHaveLength(1)
    })

    it('fetches completed tasks', async () => {
      const completedTask = { ...mockDbTask, status: 'done' as const, completed_at: '2024-01-15T10:00:00Z' }
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [completedTask], error: null }) // tasks query
      mockSupabase.queueResult({ data: [], error: null }) // subtasks query

      const result = await tasksService.getByStatus(mockSupabase, 'done')

      expect(result).toHaveLength(1)
      expect(result[0].completedAt).toBe('2024-01-15T10:00:00Z')
    })
  })

  describe('create', () => {
    it('creates a task with basic fields', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [], error: null }) // max order query
      mockSupabase.queueResult({ data: mockDbTask, error: null }) // insert query

      const result = await tasksService.create(mockSupabase, {
        title: 'Complete project',
        description: 'Finish the MVP',
        areaId: 'health',
        dueDate: '2024-01-20',
        priority: 'high',
        status: 'pending',
        tags: ['work', 'important'],
        estimatedMinutes: 120,
      })

      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
      expect(result.title).toBe('Complete project')
      expect(result.priority).toBe('high')
      expect(result.status).toBe('pending')
    })

    it('creates a task with recurrence', async () => {
      const recurringTask = {
        ...mockDbTask,
        recurrence_type: 'weekly' as const,
        recurrence_interval: 1,
        recurrence_end_date: '2024-12-31',
      }
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [], error: null }) // max order query
      mockSupabase.queueResult({ data: recurringTask, error: null }) // insert query

      const result = await tasksService.create(mockSupabase, {
        title: 'Weekly review',
        status: 'pending',
        tags: [],
        recurrence: { type: 'weekly', interval: 1, endDate: '2024-12-31' },
      })

      expect(result.recurrence).toEqual({
        type: 'weekly',
        interval: 1,
        endDate: '2024-12-31',
      })
    })

    it('throws error when user not authenticated', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await expect(
        tasksService.create(mockSupabase, {
          title: 'Test',
          status: 'pending',
          tags: [],
        })
      ).rejects.toThrow('User not authenticated')
    })
  })

  describe('update', () => {
    it('updates task title and description', async () => {
      const updatedTask = {
        ...mockDbTask,
        title: 'Updated title',
        description: 'Updated description',
      }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: updatedTask, error: null }) // update query
      mockSupabase.queueResult({ data: [], error: null }) // subtasks query

      const result = await tasksService.update(mockSupabase, 'task-1', {
        title: 'Updated title',
        description: 'Updated description',
      })

      expect(result.title).toBe('Updated title')
      expect(result.description).toBe('Updated description')
    })

    it('updates task status', async () => {
      const completedTask = {
        ...mockDbTask,
        status: 'done' as const,
        completed_at: '2024-01-15T10:00:00Z',
      }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: completedTask, error: null }) // update query
      mockSupabase.queueResult({ data: [], error: null }) // subtasks query

      const result = await tasksService.update(mockSupabase, 'task-1', {
        status: 'done',
        completedAt: '2024-01-15T10:00:00Z',
      })

      expect(result.status).toBe('done')
      expect(result.completedAt).toBe('2024-01-15T10:00:00Z')
    })

    it('updates task priority', async () => {
      const updatedTask = { ...mockDbTask, priority: 'urgent' as const }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: updatedTask, error: null }) // update query
      mockSupabase.queueResult({ data: [], error: null }) // subtasks query

      const result = await tasksService.update(mockSupabase, 'task-1', {
        priority: 'urgent',
      })

      expect(result.priority).toBe('urgent')
    })

    it('adds recurrence to existing task', async () => {
      const recurringTask = {
        ...mockDbTask,
        recurrence_type: 'daily' as const,
        recurrence_interval: 1,
        recurrence_end_date: null,
      }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: recurringTask, error: null }) // update query
      mockSupabase.queueResult({ data: [], error: null }) // subtasks query

      const result = await tasksService.update(mockSupabase, 'task-1', {
        recurrence: { type: 'daily', interval: 1 },
      })

      expect(result.recurrence).toEqual({ type: 'daily', interval: 1 })
    })

    it('removes recurrence from task', async () => {
      const nonRecurringTask = {
        ...mockDbTask,
        recurrence_type: null,
        recurrence_interval: null,
        recurrence_end_date: null,
      }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: nonRecurringTask, error: null }) // update query
      mockSupabase.queueResult({ data: [], error: null }) // subtasks query

      const result = await tasksService.update(mockSupabase, 'task-1', {
        recurrence: undefined,
      })

      expect(result.recurrence).toBeUndefined()
    })
  })

  describe('delete', () => {
    it('deletes a task', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ error: null })

      await tasksService.delete(mockSupabase, 'task-1')

      expect(mockSupabase.from).toHaveBeenCalledWith('tasks')
      expect(mockSupabase.mockChain.delete).toHaveBeenCalled()
      expect(mockSupabase.mockChain.eq).toHaveBeenCalledWith('id', 'task-1')
    })

    it('throws error when delete fails', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ error: { message: 'Delete failed' } })

      await expect(tasksService.delete(mockSupabase, 'task-1')).rejects.toEqual({
        message: 'Delete failed',
      })
    })
  })

  describe('deleteMany', () => {
    it('deletes multiple tasks', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ error: null })

      await tasksService.deleteMany(mockSupabase, ['task-1', 'task-2', 'task-3'])

      expect(mockSupabase.from).toHaveBeenCalledWith('tasks')
      expect(mockSupabase.mockChain.delete).toHaveBeenCalled()
      expect(mockSupabase.mockChain.in).toHaveBeenCalledWith('id', ['task-1', 'task-2', 'task-3'])
    })

    it('does nothing when given empty array', async () => {
      const mockSupabase = createMockSupabase()

      await tasksService.deleteMany(mockSupabase, [])

      expect(mockSupabase.from).not.toHaveBeenCalled()
    })
  })

  describe('getByLinkedTransactionId', () => {
    it('finds task by linked transaction', async () => {
      const linkedTask = { ...mockDbTask, linked_transaction_id: 'txn-1' }
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [linkedTask], error: null }) // task query
      mockSupabase.queueResult({ data: [], error: null }) // subtasks query

      const result = await tasksService.getByLinkedTransactionId(mockSupabase, 'txn-1')

      expect(result).not.toBeNull()
      expect(result?.linkedTransactionId).toBe('txn-1')
    })

    it('returns null when no linked task found', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [], error: null })

      const result = await tasksService.getByLinkedTransactionId(mockSupabase, 'non-existent')

      expect(result).toBeNull()
    })
  })

  describe('setStatus', () => {
    it('marks task as done', async () => {
      const completedTask = {
        ...mockDbTask,
        status: 'done' as const,
        completed_at: expect.any(String),
      }

      const mockSupabase = createMockSupabase()
      // getById first
      mockSupabase.queueResult({ data: mockDbTask, error: null }) // current task
      mockSupabase.queueResult({ data: [mockDbSubtask], error: null }) // subtasks
      // update
      mockSupabase.queueResult({ data: completedTask, error: null }) // update result

      const result = await tasksService.setStatus(mockSupabase, 'task-1', 'done')

      expect(result.task.status).toBe('done')
      expect(result.task.completedAt).toBeDefined()
    })

    it('marks task as pending (unmark done)', async () => {
      const doneTask = {
        ...mockDbTask,
        status: 'done' as const,
        completed_at: '2024-01-15T10:00:00Z',
      }
      const pendingTask = {
        ...mockDbTask,
        status: 'pending' as const,
        completed_at: null,
      }

      const mockSupabase = createMockSupabase()
      // getById first
      mockSupabase.queueResult({ data: doneTask, error: null }) // current task
      mockSupabase.queueResult({ data: [], error: null }) // subtasks
      // update
      mockSupabase.queueResult({ data: pendingTask, error: null }) // update result

      const result = await tasksService.setStatus(mockSupabase, 'task-1', 'pending')

      expect(result.task.status).toBe('pending')
      expect(result.task.completedAt).toBeUndefined()
    })

    it('creates new recurring task when completing recurring task', async () => {
      const recurringTask = {
        ...mockDbTask,
        recurrence_type: 'daily' as const,
        recurrence_interval: 1,
        recurrence_end_date: null,
      }
      const completedTask = {
        ...recurringTask,
        status: 'done' as const,
        completed_at: '2024-01-20T10:00:00Z',
      }
      const newTask = {
        ...recurringTask,
        id: 'task-2',
        due_date: '2024-01-21',
        status: 'pending' as const,
      }

      const mockSupabase = createMockSupabase()
      // getById
      mockSupabase.queueResult({ data: recurringTask, error: null })
      mockSupabase.queueResult({ data: [], error: null }) // subtasks
      // update
      mockSupabase.queueResult({ data: completedTask, error: null })
      // get max order for new task
      mockSupabase.queueResult({ data: [{ order: 0 }], error: null })
      // insert new recurring task
      mockSupabase.queueResult({ data: newTask, error: null })
      // get subtasks for new task
      mockSupabase.queueResult({ data: [], error: null })

      const result = await tasksService.setStatus(mockSupabase, 'task-1', 'done')

      expect(result.task.status).toBe('done')
      expect(result.newRecurringTask).toBeDefined()
      expect(result.newRecurringTask?.dueDate).toBe('2024-01-21')
    })

    it('throws error when user not authenticated', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await expect(
        tasksService.setStatus(mockSupabase, 'task-1', 'done')
      ).rejects.toThrow('User not authenticated')
    })
  })

  describe('reorder', () => {
    it('updates order for multiple tasks', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ error: null })
      mockSupabase.queueResult({ error: null })
      mockSupabase.queueResult({ error: null })

      await tasksService.reorder(mockSupabase, ['task-3', 'task-1', 'task-2'])

      expect(mockSupabase.from).toHaveBeenCalledWith('tasks')
      expect(mockSupabase.mockChain.update).toHaveBeenCalledTimes(3)
    })
  })
})

describe('subtasksService', () => {
  describe('add', () => {
    it('adds a subtask to a task', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [], error: null }) // max order query
      mockSupabase.queueResult({ data: mockDbSubtask, error: null }) // insert query

      const result = await subtasksService.add(mockSupabase, 'task-1', 'Research')

      expect(result.title).toBe('Research')
      expect(result.done).toBe(false)
    })

    it('adds subtask with correct order', async () => {
      const existingSubtask = { ...mockDbSubtask, order: 2 }
      const newSubtask = { ...mockDbSubtask, id: 'subtask-2', title: 'Implementation', order: 3 }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [existingSubtask], error: null }) // max order query
      mockSupabase.queueResult({ data: newSubtask, error: null }) // insert query

      const result = await subtasksService.add(mockSupabase, 'task-1', 'Implementation')

      expect(result.title).toBe('Implementation')
    })
  })

  describe('toggle', () => {
    it('toggles subtask from incomplete to complete', async () => {
      const toggledSubtask = { ...mockDbSubtask, done: true }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: mockDbSubtask, error: null }) // get current
      mockSupabase.queueResult({ data: toggledSubtask, error: null }) // update

      const result = await subtasksService.toggle(mockSupabase, 'subtask-1')

      expect(result.done).toBe(true)
    })

    it('toggles subtask from complete to incomplete', async () => {
      const completedSubtask = { ...mockDbSubtask, done: true }
      const uncompletedSubtask = { ...mockDbSubtask, done: false }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: completedSubtask, error: null }) // get current
      mockSupabase.queueResult({ data: uncompletedSubtask, error: null }) // update

      const result = await subtasksService.toggle(mockSupabase, 'subtask-1')

      expect(result.done).toBe(false)
    })
  })

  describe('delete', () => {
    it('deletes a subtask', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ error: null })

      await subtasksService.delete(mockSupabase, 'subtask-1')

      expect(mockSupabase.from).toHaveBeenCalledWith('subtasks')
      expect(mockSupabase.mockChain.delete).toHaveBeenCalled()
      expect(mockSupabase.mockChain.eq).toHaveBeenCalledWith('id', 'subtask-1')
    })
  })

  describe('update', () => {
    it('updates subtask title', async () => {
      const updatedSubtask = { ...mockDbSubtask, title: 'Updated title' }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: updatedSubtask, error: null })

      const result = await subtasksService.update(mockSupabase, 'subtask-1', 'Updated title')

      expect(result.title).toBe('Updated title')
    })
  })
})
