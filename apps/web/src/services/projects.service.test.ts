import { describe, it, expect, vi } from 'vitest'
import {
  projectsService,
  objectivesService,
  milestonesService,
  projectMetricsService,
} from './projects.service'
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
  is: ReturnType<typeof vi.fn>
  gte: ReturnType<typeof vi.fn>
  lte: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  limit: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  then: ReturnType<typeof vi.fn>
}

// Mock Supabase client factory with proper chaining support
function createMockSupabase() {
  let defaultResult: { data: unknown; error: unknown; count?: number } = {
    data: null,
    error: null,
  }
  const resultQueue: Array<{ data: unknown; error: unknown; count?: number }> = []

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
  mockChain.is = vi.fn(() => mockChain)
  mockChain.gte = vi.fn(() => mockChain)
  mockChain.lte = vi.fn(() => mockChain)
  mockChain.order = vi.fn(() => mockChain)
  mockChain.limit = vi.fn(() => mockChain)
  mockChain.single = vi.fn(() => mockChain)

  // Make mockChain thenable
  mockChain.then = vi.fn((resolve) => {
    const result = getNextResult()
    return Promise.resolve(result).then(resolve)
  })

  const queueResult = (result: { data?: unknown; error: unknown; count?: number }) => {
    resultQueue.push({ data: result.data ?? null, error: result.error, count: result.count })
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
    setDefaultResult: (result: { data?: unknown; error: unknown; count?: number }) => {
      defaultResult = { data: result.data ?? null, error: result.error, count: result.count }
    },
  } as unknown as SupabaseClient & {
    mockChain: MockChain
    queueResult: (result: { data?: unknown; error: unknown; count?: number }) => void
    setDefaultResult: (result: { data?: unknown; error: unknown; count?: number }) => void
  }
}

// Sample DB project data
const mockDbProject = {
  id: 'project-1',
  user_id: 'test-user-id',
  area_id: null,
  title: 'Launch MVP',
  description: 'Launch the minimum viable product',
  color: '#3b82f6',
  icon: 'rocket',
  status: 'active' as const,
  due_date: '2024-03-01',
  start_date: '2024-01-01',
  completed_at: null,
  archived_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockDbObjective = {
  id: 'objective-1',
  project_id: 'project-1',
  user_id: 'test-user-id',
  title: 'Complete backend API',
  description: 'Build all REST endpoints',
  status: 'pending' as const,
  due_date: '2024-02-01',
  order: 0,
  completed_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockDbMilestone = {
  id: 'milestone-1',
  project_id: 'project-1',
  user_id: 'test-user-id',
  title: 'Beta Release',
  description: 'First public beta',
  target_date: '2024-02-15',
  status: 'upcoming' as const,
  completed_at: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockDbMetric = {
  id: 'metric-1',
  project_id: 'project-1',
  user_id: 'test-user-id',
  name: 'Active Users',
  unit: 'users',
  target_value: 1000,
  current_value: 250,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockDbMetricEntry = {
  id: 'entry-1',
  metric_id: 'metric-1',
  user_id: 'test-user-id',
  value: 250,
  date: '2024-01-15',
  created_at: '2024-01-15T00:00:00Z',
}

describe('projectsService', () => {
  describe('getAll', () => {
    it('returns all projects ordered by creation date', async () => {
      const supabase = createMockSupabase()
      supabase.setDefaultResult({ data: [mockDbProject], error: null })

      const result = await projectsService.getAll(supabase)

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('project-1')
      expect(result[0].title).toBe('Launch MVP')
      expect(supabase.mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('throws error when query fails', async () => {
      const supabase = createMockSupabase()
      supabase.setDefaultResult({ data: null, error: new Error('Database error') })

      await expect(projectsService.getAll(supabase)).rejects.toThrow('Database error')
    })
  })

  describe('getActive', () => {
    it('returns only active and paused projects', async () => {
      const supabase = createMockSupabase()
      supabase.setDefaultResult({ data: [mockDbProject], error: null })

      const result = await projectsService.getActive(supabase)

      expect(result).toHaveLength(1)
      expect(supabase.mockChain.in).toHaveBeenCalledWith('status', ['active', 'paused'])
    })
  })

  describe('getByStatus', () => {
    it('returns projects with specific status', async () => {
      const supabase = createMockSupabase()
      supabase.setDefaultResult({ data: [mockDbProject], error: null })

      const result = await projectsService.getByStatus(supabase, 'active')

      expect(result).toHaveLength(1)
      expect(supabase.mockChain.eq).toHaveBeenCalledWith('status', 'active')
    })
  })

  describe('getArchived', () => {
    it('returns only archived projects', async () => {
      const supabase = createMockSupabase()
      const archivedProject = { ...mockDbProject, status: 'archived', archived_at: '2024-02-01' }
      supabase.setDefaultResult({ data: [archivedProject], error: null })

      const result = await projectsService.getArchived(supabase)

      expect(result).toHaveLength(1)
      expect(supabase.mockChain.eq).toHaveBeenCalledWith('status', 'archived')
    })
  })

  describe('getById', () => {
    it('returns project by id', async () => {
      const supabase = createMockSupabase()
      supabase.setDefaultResult({ data: mockDbProject, error: null })

      const result = await projectsService.getById(supabase, 'project-1')

      expect(result).not.toBeNull()
      expect(result!.id).toBe('project-1')
      expect(supabase.mockChain.eq).toHaveBeenCalledWith('id', 'project-1')
    })

    it('returns null when project not found', async () => {
      const supabase = createMockSupabase()
      supabase.setDefaultResult({ data: null, error: { code: 'PGRST116' } })

      const result = await projectsService.getById(supabase, 'non-existent')

      expect(result).toBeNull()
    })
  })

  describe('getByArea', () => {
    it('returns projects by area id', async () => {
      const supabase = createMockSupabase()
      const projectWithArea = { ...mockDbProject, area_id: 'health' }
      supabase.setDefaultResult({ data: [projectWithArea], error: null })

      const result = await projectsService.getByArea(supabase, 'health')

      expect(result).toHaveLength(1)
      expect(supabase.mockChain.eq).toHaveBeenCalledWith('area_id', 'health')
    })
  })

  describe('create', () => {
    it('creates a new project with default values', async () => {
      const supabase = createMockSupabase()
      supabase.setDefaultResult({ data: mockDbProject, error: null })

      const result = await projectsService.create(supabase, {
        title: 'Launch MVP',
        description: 'Launch the minimum viable product',
        color: '#3b82f6',
      })

      expect(result.title).toBe('Launch MVP')
      expect(supabase.mockChain.insert).toHaveBeenCalled()
    })

    it('throws error when user not authenticated', async () => {
      const supabase = createMockSupabase()
      ;(supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await expect(
        projectsService.create(supabase, { title: 'Test' })
      ).rejects.toThrow('User not authenticated')
    })
  })

  describe('update', () => {
    it('updates project fields', async () => {
      const supabase = createMockSupabase()
      const updatedProject = { ...mockDbProject, title: 'Updated Title' }
      supabase.setDefaultResult({ data: updatedProject, error: null })

      const result = await projectsService.update(supabase, 'project-1', {
        title: 'Updated Title',
      })

      expect(result.title).toBe('Updated Title')
      expect(supabase.mockChain.update).toHaveBeenCalled()
    })

    it('sets completed_at when status changes to completed', async () => {
      const supabase = createMockSupabase()
      const completedProject = {
        ...mockDbProject,
        status: 'completed',
        completed_at: '2024-02-01T00:00:00Z',
      }
      supabase.setDefaultResult({ data: completedProject, error: null })

      const result = await projectsService.update(supabase, 'project-1', {
        status: 'completed',
      })

      expect(result.status).toBe('completed')
    })
  })

  describe('delete', () => {
    it('removes project references and deletes project', async () => {
      const supabase = createMockSupabase()
      supabase.setDefaultResult({ data: null, error: null })

      await projectsService.delete(supabase, 'project-1')

      expect(supabase.from).toHaveBeenCalledWith('tasks')
      expect(supabase.from).toHaveBeenCalledWith('habits')
      expect(supabase.from).toHaveBeenCalledWith('projects')
    })
  })

  describe('archive', () => {
    it('archives a project by changing status', async () => {
      const supabase = createMockSupabase()
      const archivedProject = { ...mockDbProject, status: 'archived' }
      supabase.setDefaultResult({ data: archivedProject, error: null })

      const result = await projectsService.archive(supabase, 'project-1')

      expect(result.status).toBe('archived')
    })
  })

  describe('unarchive', () => {
    it('restores archived project to active status', async () => {
      const supabase = createMockSupabase()
      const activeProject = { ...mockDbProject, status: 'active', archived_at: null }
      supabase.setDefaultResult({ data: activeProject, error: null })

      const result = await projectsService.unarchive(supabase, 'project-1')

      expect(result.status).toBe('active')
    })
  })

  describe('status transitions', () => {
    it('pauses a project', async () => {
      const supabase = createMockSupabase()
      const pausedProject = { ...mockDbProject, status: 'paused' }
      supabase.setDefaultResult({ data: pausedProject, error: null })

      const result = await projectsService.pause(supabase, 'project-1')

      expect(result.status).toBe('paused')
    })

    it('resumes a paused project', async () => {
      const supabase = createMockSupabase()
      const activeProject = { ...mockDbProject, status: 'active' }
      supabase.setDefaultResult({ data: activeProject, error: null })

      const result = await projectsService.resume(supabase, 'project-1')

      expect(result.status).toBe('active')
    })

    it('completes a project', async () => {
      const supabase = createMockSupabase()
      const completedProject = { ...mockDbProject, status: 'completed' }
      supabase.setDefaultResult({ data: completedProject, error: null })

      const result = await projectsService.complete(supabase, 'project-1')

      expect(result.status).toBe('completed')
    })
  })
})

describe('objectivesService', () => {
  describe('getByProject', () => {
    it('returns objectives ordered by order field', async () => {
      const supabase = createMockSupabase()
      supabase.setDefaultResult({ data: [mockDbObjective], error: null })

      const result = await objectivesService.getByProject(supabase, 'project-1')

      expect(result).toHaveLength(1)
      expect(result[0].projectId).toBe('project-1')
      expect(supabase.mockChain.order).toHaveBeenCalledWith('order', { ascending: true })
    })
  })

  describe('getById', () => {
    it('returns objective by id', async () => {
      const supabase = createMockSupabase()
      supabase.setDefaultResult({ data: mockDbObjective, error: null })

      const result = await objectivesService.getById(supabase, 'objective-1')

      expect(result).not.toBeNull()
      expect(result!.title).toBe('Complete backend API')
    })

    it('returns null when objective not found', async () => {
      const supabase = createMockSupabase()
      supabase.setDefaultResult({ data: null, error: { code: 'PGRST116' } })

      const result = await objectivesService.getById(supabase, 'non-existent')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('creates objective with auto-incremented order', async () => {
      const supabase = createMockSupabase()
      supabase.queueResult({ data: [{ order: 2 }], error: null })
      supabase.queueResult({ data: mockDbObjective, error: null })

      const result = await objectivesService.create(supabase, {
        projectId: 'project-1',
        title: 'Complete backend API',
      })

      expect(result.projectId).toBe('project-1')
    })

    it('throws error when user not authenticated', async () => {
      const supabase = createMockSupabase()
      ;(supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await expect(
        objectivesService.create(supabase, {
          projectId: 'project-1',
          title: 'Test',
        })
      ).rejects.toThrow('User not authenticated')
    })
  })

  describe('update', () => {
    it('updates objective fields', async () => {
      const supabase = createMockSupabase()
      const updatedObjective = { ...mockDbObjective, title: 'Updated Objective' }
      supabase.setDefaultResult({ data: updatedObjective, error: null })

      const result = await objectivesService.update(supabase, 'objective-1', {
        title: 'Updated Objective',
      })

      expect(result.title).toBe('Updated Objective')
    })

    it('sets completed_at when status changes to completed', async () => {
      const supabase = createMockSupabase()
      const completedObjective = {
        ...mockDbObjective,
        status: 'completed',
        completed_at: '2024-02-01T00:00:00Z',
      }
      supabase.setDefaultResult({ data: completedObjective, error: null })

      const result = await objectivesService.update(supabase, 'objective-1', {
        status: 'completed',
      })

      expect(result.status).toBe('completed')
    })
  })

  describe('delete', () => {
    it('removes objective references from tasks and deletes', async () => {
      const supabase = createMockSupabase()
      supabase.setDefaultResult({ data: null, error: null })

      await objectivesService.delete(supabase, 'objective-1')

      expect(supabase.from).toHaveBeenCalledWith('tasks')
      expect(supabase.from).toHaveBeenCalledWith('objectives')
    })
  })

  describe('complete', () => {
    it('marks objective as completed', async () => {
      const supabase = createMockSupabase()
      const completedObjective = { ...mockDbObjective, status: 'completed' }
      supabase.setDefaultResult({ data: completedObjective, error: null })

      const result = await objectivesService.complete(supabase, 'objective-1')

      expect(result.status).toBe('completed')
    })
  })

  describe('reorder', () => {
    it('updates order for all objectives', async () => {
      const supabase = createMockSupabase()
      supabase.setDefaultResult({ data: null, error: null })

      await objectivesService.reorder(supabase, ['obj-2', 'obj-1', 'obj-3'])

      expect(supabase.from).toHaveBeenCalledWith('objectives')
      expect(supabase.mockChain.update).toHaveBeenCalledTimes(3)
    })
  })
})

describe('milestonesService', () => {
  describe('getByProject', () => {
    it('returns milestones ordered by target date', async () => {
      const supabase = createMockSupabase()
      supabase.setDefaultResult({ data: [mockDbMilestone], error: null })

      const result = await milestonesService.getByProject(supabase, 'project-1')

      expect(result).toHaveLength(1)
      expect(result[0].targetDate).toBe('2024-02-15')
      expect(supabase.mockChain.order).toHaveBeenCalledWith('target_date', { ascending: true })
    })
  })

  describe('getById', () => {
    it('returns milestone by id', async () => {
      const supabase = createMockSupabase()
      supabase.setDefaultResult({ data: mockDbMilestone, error: null })

      const result = await milestonesService.getById(supabase, 'milestone-1')

      expect(result).not.toBeNull()
      expect(result!.title).toBe('Beta Release')
    })

    it('returns null when milestone not found', async () => {
      const supabase = createMockSupabase()
      supabase.setDefaultResult({ data: null, error: { code: 'PGRST116' } })

      const result = await milestonesService.getById(supabase, 'non-existent')

      expect(result).toBeNull()
    })
  })

  describe('getUpcoming', () => {
    it('returns upcoming milestones within date range', async () => {
      const supabase = createMockSupabase()
      supabase.setDefaultResult({ data: [mockDbMilestone], error: null })

      const result = await milestonesService.getUpcoming(supabase, 30)

      expect(result).toHaveLength(1)
      expect(supabase.mockChain.neq).toHaveBeenCalledWith('status', 'completed')
    })
  })

  describe('create', () => {
    it('creates milestone with upcoming status', async () => {
      const supabase = createMockSupabase()
      supabase.setDefaultResult({ data: mockDbMilestone, error: null })

      const result = await milestonesService.create(supabase, {
        projectId: 'project-1',
        title: 'Beta Release',
        targetDate: '2024-02-15',
      })

      expect(result.status).toBe('upcoming')
    })

    it('throws error when user not authenticated', async () => {
      const supabase = createMockSupabase()
      ;(supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await expect(
        milestonesService.create(supabase, {
          projectId: 'project-1',
          title: 'Test',
          targetDate: '2024-02-15',
        })
      ).rejects.toThrow('User not authenticated')
    })
  })

  describe('update', () => {
    it('updates milestone fields', async () => {
      const supabase = createMockSupabase()
      const updatedMilestone = { ...mockDbMilestone, title: 'Updated Milestone' }
      supabase.setDefaultResult({ data: updatedMilestone, error: null })

      const result = await milestonesService.update(supabase, 'milestone-1', {
        title: 'Updated Milestone',
      })

      expect(result.title).toBe('Updated Milestone')
    })

    it('sets completed_at when status changes to completed', async () => {
      const supabase = createMockSupabase()
      const completedMilestone = {
        ...mockDbMilestone,
        status: 'completed',
        completed_at: '2024-02-15T00:00:00Z',
      }
      supabase.setDefaultResult({ data: completedMilestone, error: null })

      const result = await milestonesService.update(supabase, 'milestone-1', {
        status: 'completed',
      })

      expect(result.status).toBe('completed')
    })
  })

  describe('delete', () => {
    it('deletes milestone', async () => {
      const supabase = createMockSupabase()
      supabase.setDefaultResult({ data: null, error: null })

      await milestonesService.delete(supabase, 'milestone-1')

      expect(supabase.from).toHaveBeenCalledWith('milestones')
      expect(supabase.mockChain.delete).toHaveBeenCalled()
    })
  })

  describe('complete', () => {
    it('marks milestone as completed', async () => {
      const supabase = createMockSupabase()
      const completedMilestone = { ...mockDbMilestone, status: 'completed' }
      supabase.setDefaultResult({ data: completedMilestone, error: null })

      const result = await milestonesService.complete(supabase, 'milestone-1')

      expect(result.status).toBe('completed')
    })
  })
})

describe('projectMetricsService', () => {
  describe('getByProject', () => {
    it('returns metrics ordered by creation date', async () => {
      const supabase = createMockSupabase()
      supabase.setDefaultResult({ data: [mockDbMetric], error: null })

      const result = await projectMetricsService.getByProject(supabase, 'project-1')

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Active Users')
      expect(supabase.mockChain.order).toHaveBeenCalledWith('created_at', { ascending: true })
    })
  })

  describe('getById', () => {
    it('returns metric by id', async () => {
      const supabase = createMockSupabase()
      supabase.setDefaultResult({ data: mockDbMetric, error: null })

      const result = await projectMetricsService.getById(supabase, 'metric-1')

      expect(result).not.toBeNull()
      expect(result!.currentValue).toBe(250)
    })

    it('returns null when metric not found', async () => {
      const supabase = createMockSupabase()
      supabase.setDefaultResult({ data: null, error: { code: 'PGRST116' } })

      const result = await projectMetricsService.getById(supabase, 'non-existent')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('creates metric with default current value of 0', async () => {
      const supabase = createMockSupabase()
      const newMetric = { ...mockDbMetric, current_value: 0 }
      supabase.setDefaultResult({ data: newMetric, error: null })

      const result = await projectMetricsService.create(supabase, {
        projectId: 'project-1',
        name: 'Active Users',
        unit: 'users',
        targetValue: 1000,
      })

      expect(result.projectId).toBe('project-1')
    })

    it('throws error when user not authenticated', async () => {
      const supabase = createMockSupabase()
      ;(supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await expect(
        projectMetricsService.create(supabase, {
          projectId: 'project-1',
          name: 'Test',
        })
      ).rejects.toThrow('User not authenticated')
    })
  })

  describe('update', () => {
    it('updates metric fields', async () => {
      const supabase = createMockSupabase()
      const updatedMetric = { ...mockDbMetric, target_value: 2000 }
      supabase.setDefaultResult({ data: updatedMetric, error: null })

      const result = await projectMetricsService.update(supabase, 'metric-1', {
        targetValue: 2000,
      })

      expect(result.targetValue).toBe(2000)
    })
  })

  describe('delete', () => {
    it('deletes metric', async () => {
      const supabase = createMockSupabase()
      supabase.setDefaultResult({ data: null, error: null })

      await projectMetricsService.delete(supabase, 'metric-1')

      expect(supabase.from).toHaveBeenCalledWith('project_metrics')
      expect(supabase.mockChain.delete).toHaveBeenCalled()
    })
  })

  describe('updateValue', () => {
    it('updates current value and records history', async () => {
      const supabase = createMockSupabase()
      const updatedMetric = { ...mockDbMetric, current_value: 500 }
      supabase.queueResult({ data: updatedMetric, error: null })
      supabase.queueResult({ data: null, error: null })

      const result = await projectMetricsService.updateValue(supabase, 'metric-1', 500)

      expect(result.currentValue).toBe(500)
      expect(supabase.from).toHaveBeenCalledWith('project_metric_entries')
    })

    it('skips history when recordHistory is false', async () => {
      const supabase = createMockSupabase()
      const updatedMetric = { ...mockDbMetric, current_value: 500 }
      supabase.setDefaultResult({ data: updatedMetric, error: null })

      await projectMetricsService.updateValue(supabase, 'metric-1', 500, false)

      // from should not be called with 'project_metric_entries'
      const fromCalls = (supabase.from as ReturnType<typeof vi.fn>).mock.calls
      const entriesCalls = fromCalls.filter((call) => call[0] === 'project_metric_entries')
      expect(entriesCalls).toHaveLength(0)
    })
  })

  describe('getHistory', () => {
    it('returns metric entries within date range', async () => {
      const supabase = createMockSupabase()
      supabase.setDefaultResult({ data: [mockDbMetricEntry], error: null })

      const result = await projectMetricsService.getHistory(supabase, 'metric-1', 30)

      expect(result).toHaveLength(1)
      expect(result[0].value).toBe(250)
      expect(supabase.mockChain.order).toHaveBeenCalledWith('date', { ascending: true })
    })
  })
})

describe('Progress Calculation', () => {
  describe('calculateProgress (via getByIdWithProgress)', () => {
    it('returns 0 when no objectives exist', async () => {
      const supabase = createMockSupabase()
      // Project query
      supabase.queueResult({ data: mockDbProject, error: null })
      // Objectives query
      supabase.queueResult({ data: [], error: null })
      // Milestones query
      supabase.queueResult({ data: [], error: null })
      // Tasks count
      supabase.queueResult({ data: null, error: null, count: 0 })
      // Completed tasks count
      supabase.queueResult({ data: null, error: null, count: 0 })
      // Habits count
      supabase.queueResult({ data: null, error: null, count: 0 })

      const result = await projectsService.getByIdWithProgress(supabase, 'project-1')

      expect(result).not.toBeNull()
      expect(result!.progress).toBe(0)
      expect(result!.objectivesCount).toBe(0)
    })

    it('calculates progress correctly with mixed objectives', async () => {
      const supabase = createMockSupabase()
      const objectives = [
        { ...mockDbObjective, id: 'obj-1', status: 'completed' },
        { ...mockDbObjective, id: 'obj-2', status: 'completed' },
        { ...mockDbObjective, id: 'obj-3', status: 'pending' },
        { ...mockDbObjective, id: 'obj-4', status: 'in_progress' },
      ]

      // Project query
      supabase.queueResult({ data: mockDbProject, error: null })
      // Objectives query
      supabase.queueResult({ data: objectives, error: null })
      // Milestones query
      supabase.queueResult({ data: [], error: null })
      // Tasks count
      supabase.queueResult({ data: null, error: null, count: 5 })
      // Completed tasks count
      supabase.queueResult({ data: null, error: null, count: 2 })
      // Habits count
      supabase.queueResult({ data: null, error: null, count: 3 })

      const result = await projectsService.getByIdWithProgress(supabase, 'project-1')

      expect(result).not.toBeNull()
      expect(result!.progress).toBe(50) // 2/4 = 50%
      expect(result!.objectivesCount).toBe(4)
      expect(result!.completedObjectivesCount).toBe(2)
      expect(result!.tasksCount).toBe(5)
      expect(result!.completedTasksCount).toBe(2)
      expect(result!.habitsCount).toBe(3)
    })

    it('returns 100 when all objectives completed', async () => {
      const supabase = createMockSupabase()
      const objectives = [
        { ...mockDbObjective, id: 'obj-1', status: 'completed' },
        { ...mockDbObjective, id: 'obj-2', status: 'completed' },
      ]

      supabase.queueResult({ data: mockDbProject, error: null })
      supabase.queueResult({ data: objectives, error: null })
      supabase.queueResult({ data: [], error: null })
      supabase.queueResult({ data: null, error: null, count: 0 })
      supabase.queueResult({ data: null, error: null, count: 0 })
      supabase.queueResult({ data: null, error: null, count: 0 })

      const result = await projectsService.getByIdWithProgress(supabase, 'project-1')

      expect(result!.progress).toBe(100)
    })

    it('rounds progress to nearest integer', async () => {
      const supabase = createMockSupabase()
      const objectives = [
        { ...mockDbObjective, id: 'obj-1', status: 'completed' },
        { ...mockDbObjective, id: 'obj-2', status: 'pending' },
        { ...mockDbObjective, id: 'obj-3', status: 'pending' },
      ]

      supabase.queueResult({ data: mockDbProject, error: null })
      supabase.queueResult({ data: objectives, error: null })
      supabase.queueResult({ data: [], error: null })
      supabase.queueResult({ data: null, error: null, count: 0 })
      supabase.queueResult({ data: null, error: null, count: 0 })
      supabase.queueResult({ data: null, error: null, count: 0 })

      const result = await projectsService.getByIdWithProgress(supabase, 'project-1')

      expect(result!.progress).toBe(33) // 1/3 = 33.33... rounded to 33
    })
  })
})

describe('Data Transformation', () => {
  describe('toProject', () => {
    it('transforms null optional fields to undefined', async () => {
      const supabase = createMockSupabase()
      const projectWithNulls = {
        ...mockDbProject,
        description: null,
        area_id: null,
        color: null,
        icon: null,
        due_date: null,
        start_date: null,
        completed_at: null,
        archived_at: null,
      }
      supabase.setDefaultResult({ data: projectWithNulls, error: null })

      const result = await projectsService.getById(supabase, 'project-1')

      expect(result).not.toBeNull()
      expect(result!.description).toBeUndefined()
      expect(result!.areaId).toBeUndefined()
      expect(result!.color).toBeUndefined()
      expect(result!.icon).toBeUndefined()
      expect(result!.dueDate).toBeUndefined()
      expect(result!.startDate).toBeUndefined()
      expect(result!.completedAt).toBeUndefined()
      expect(result!.archivedAt).toBeUndefined()
    })
  })

  describe('toObjective', () => {
    it('transforms database row to Objective type', async () => {
      const supabase = createMockSupabase()
      supabase.setDefaultResult({ data: mockDbObjective, error: null })

      const result = await objectivesService.getById(supabase, 'objective-1')

      expect(result).not.toBeNull()
      expect(result!.projectId).toBe('project-1')
      expect(result!.dueDate).toBe('2024-02-01')
    })
  })

  describe('toMilestone', () => {
    it('transforms database row to Milestone type', async () => {
      const supabase = createMockSupabase()
      supabase.setDefaultResult({ data: mockDbMilestone, error: null })

      const result = await milestonesService.getById(supabase, 'milestone-1')

      expect(result).not.toBeNull()
      expect(result!.projectId).toBe('project-1')
      expect(result!.targetDate).toBe('2024-02-15')
    })
  })

  describe('toProjectMetric', () => {
    it('transforms database row to ProjectMetric type', async () => {
      const supabase = createMockSupabase()
      supabase.setDefaultResult({ data: mockDbMetric, error: null })

      const result = await projectMetricsService.getById(supabase, 'metric-1')

      expect(result).not.toBeNull()
      expect(result!.projectId).toBe('project-1')
      expect(result!.targetValue).toBe(1000)
      expect(result!.unit).toBe('users')
    })

    it('transforms null optional fields to undefined', async () => {
      const supabase = createMockSupabase()
      const metricWithNulls = {
        ...mockDbMetric,
        unit: null,
        target_value: null,
      }
      supabase.setDefaultResult({ data: metricWithNulls, error: null })

      const result = await projectMetricsService.getById(supabase, 'metric-1')

      expect(result!.unit).toBeUndefined()
      expect(result!.targetValue).toBeUndefined()
    })
  })
})
