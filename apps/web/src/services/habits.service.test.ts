import { describe, it, expect, vi, beforeEach } from 'vitest'
import { habitsService, completionsService } from './habits.service'
import type { SupabaseClient } from '@supabase/supabase-js'

// Type for mock chain with all Supabase query methods
interface MockChain {
  select: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  upsert: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  in: ReturnType<typeof vi.fn>
  is: ReturnType<typeof vi.fn>
  gte: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  limit: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  then: ReturnType<typeof vi.fn>
  // Internal state for test result control
  _nextResult: { data: unknown; error: unknown } | null
  _setNextResult: (result: { data: unknown; error: unknown }) => void
}

// Mock Supabase client factory with proper chaining support
// All methods return mockChain for chaining, and mockChain is thenable for await
function createMockSupabase() {
  // Default result when chain is awaited
  let defaultResult: { data: unknown; error: unknown } = { data: null, error: null }
  const resultQueue: Array<{ data: unknown; error: unknown }> = []

  // Create mock chain object - must be defined before methods reference it
  const mockChain = {} as MockChain

  // Helper to get next result
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
  mockChain.upsert = vi.fn(() => mockChain)
  mockChain.eq = vi.fn(() => mockChain)
  mockChain.in = vi.fn(() => mockChain)
  mockChain.is = vi.fn(() => mockChain)
  mockChain.gte = vi.fn(() => mockChain)
  mockChain.order = vi.fn(() => mockChain)
  mockChain.limit = vi.fn(() => mockChain)

  // Single is terminal but still returns mockChain for thenable support
  mockChain.single = vi.fn(() => mockChain)

  // Make mockChain thenable - this allows `await supabase.from().select()...`
  mockChain.then = vi.fn((resolve) => {
    const result = getNextResult()
    return Promise.resolve(result).then(resolve)
  })

  // Helper to queue results for sequential queries
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

// Sample DB habit data
const mockDbHabit = {
  id: 'habit-1',
  user_id: 'test-user-id',
  area_id: 'health',
  title: 'Exercise',
  description: '30 minutes of exercise',
  frequency_type: 'daily' as const,
  frequency_data: {},
  tracking_type: 'boolean' as const,
  tracking_target: null,
  tracking_unit: null,
  color: '#22c55e',
  icon: 'dumbbell',
  order: 0,
  created_at: '2024-01-01T00:00:00Z',
  archived_at: null,
  reminder_time: '08:00',
  reminder_enabled: true,
  notebook_id: null,
}

const mockDbCompletion = {
  id: 'completion-1',
  habit_id: 'habit-1',
  user_id: 'test-user-id',
  date: '2024-01-15',
  value: 1,
  completed_at: '2024-01-15T10:00:00Z',
}

describe('habitsService', () => {
  describe('getAll', () => {
    it('fetches all habits with completions', async () => {
      const mockSupabase = createMockSupabase()

      // Queue results in order of queries
      mockSupabase.queueResult({ data: [mockDbHabit], error: null }) // habits query
      mockSupabase.queueResult({ data: [mockDbCompletion], error: null }) // completions query

      const result = await habitsService.getAll(mockSupabase)

      expect(mockSupabase.from).toHaveBeenCalledWith('habits')
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 'habit-1',
        title: 'Exercise',
        areaId: 'health',
        frequency: { type: 'daily' },
        tracking: { type: 'boolean' },
        color: '#22c55e',
      })
      expect(result[0].completions).toHaveLength(1)
    })

    it('returns empty array when no habits exist', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [], error: null })

      const result = await habitsService.getAll(mockSupabase)

      expect(result).toEqual([])
    })

    it('throws error when fetch fails', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: null, error: { message: 'Database error' } })

      await expect(habitsService.getAll(mockSupabase)).rejects.toEqual({
        message: 'Database error',
      })
    })
  })

  describe('getById', () => {
    it('fetches a habit by id with completions', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: mockDbHabit, error: null }) // habit query
      mockSupabase.queueResult({ data: [mockDbCompletion], error: null }) // completions query

      const result = await habitsService.getById(mockSupabase, 'habit-1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('habit-1')
      expect(result?.title).toBe('Exercise')
    })

    it('returns null when habit not found', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: null, error: { code: 'PGRST116', message: 'Not found' } })

      const result = await habitsService.getById(mockSupabase, 'non-existent')

      expect(result).toBeNull()
    })
  })

  describe('getByArea', () => {
    it('fetches habits filtered by area', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [mockDbHabit], error: null }) // habits query
      mockSupabase.queueResult({ data: [mockDbCompletion], error: null }) // completions query

      const result = await habitsService.getByArea(mockSupabase, 'health')

      expect(mockSupabase.mockChain.eq).toHaveBeenCalledWith('area_id', 'health')
      expect(mockSupabase.mockChain.is).toHaveBeenCalledWith('archived_at', null)
      expect(result).toHaveLength(1)
    })
  })

  describe('create', () => {
    it('creates a habit with boolean tracking', async () => {
      const mockSupabase = createMockSupabase()
      // Queue results: max order query, insert habit, insert streak
      mockSupabase.queueResult({ data: [], error: null }) // max order
      mockSupabase.queueResult({ data: mockDbHabit, error: null }) // insert habit
      mockSupabase.queueResult({ error: null }) // insert streak

      const result = await habitsService.create(mockSupabase, {
        title: 'Exercise',
        description: '30 minutes of exercise',
        areaId: 'health',
        frequency: { type: 'daily' },
        tracking: { type: 'boolean' },
        color: '#22c55e',
        icon: 'dumbbell',
      })

      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
      expect(result.title).toBe('Exercise')
      expect(result.tracking.type).toBe('boolean')
    })

    it('creates a habit with quantitative tracking', async () => {
      const quantitativeHabit = {
        ...mockDbHabit,
        tracking_type: 'quantitative' as const,
        tracking_target: 8,
        tracking_unit: 'glasses',
      }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [], error: null }) // max order
      mockSupabase.queueResult({ data: quantitativeHabit, error: null }) // insert habit
      mockSupabase.queueResult({ error: null }) // insert streak

      const result = await habitsService.create(mockSupabase, {
        title: 'Drink Water',
        areaId: 'health',
        frequency: { type: 'daily' },
        tracking: { type: 'quantitative', target: 8, unit: 'glasses' },
        color: '#3b82f6',
      })

      expect(result.tracking).toEqual({
        type: 'quantitative',
        target: 8,
        unit: 'glasses',
      })
    })

    it('creates a habit with weekly frequency', async () => {
      const weeklyHabit = {
        ...mockDbHabit,
        frequency_type: 'weekly' as const,
        frequency_data: { daysPerWeek: 3 },
      }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [], error: null }) // max order
      mockSupabase.queueResult({ data: weeklyHabit, error: null }) // insert habit
      mockSupabase.queueResult({ error: null }) // insert streak

      const result = await habitsService.create(mockSupabase, {
        title: 'Go to gym',
        areaId: 'health',
        frequency: { type: 'weekly', daysPerWeek: 3 },
        tracking: { type: 'boolean' },
        color: '#22c55e',
      })

      expect(result.frequency).toEqual({ type: 'weekly', daysPerWeek: 3 })
    })

    it('creates a habit with specificDays frequency', async () => {
      const specificDaysHabit = {
        ...mockDbHabit,
        frequency_type: 'specificDays' as const,
        frequency_data: { days: [1, 3, 5] }, // Mon, Wed, Fri
      }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [], error: null }) // max order
      mockSupabase.queueResult({ data: specificDaysHabit, error: null }) // insert habit
      mockSupabase.queueResult({ error: null }) // insert streak

      const result = await habitsService.create(mockSupabase, {
        title: 'Yoga',
        areaId: 'health',
        frequency: { type: 'specificDays', days: [1, 3, 5] },
        tracking: { type: 'boolean' },
        color: '#8b5cf6',
      })

      expect(result.frequency).toEqual({ type: 'specificDays', days: [1, 3, 5] })
    })

    it('throws error when user not authenticated', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await expect(
        habitsService.create(mockSupabase, {
          title: 'Test',
          areaId: 'health',
          frequency: { type: 'daily' },
          tracking: { type: 'boolean' },
          color: '#000',
        })
      ).rejects.toThrow('User not authenticated')
    })
  })

  describe('update', () => {
    it('updates habit title and description', async () => {
      const updatedHabit = {
        ...mockDbHabit,
        title: 'Updated Exercise',
        description: 'Updated description',
      }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: updatedHabit, error: null }) // update query
      mockSupabase.queueResult({ data: [], error: null }) // completions query

      const result = await habitsService.update(mockSupabase, 'habit-1', {
        title: 'Updated Exercise',
        description: 'Updated description',
      })

      expect(result.title).toBe('Updated Exercise')
      expect(result.description).toBe('Updated description')
    })

    it('updates habit frequency', async () => {
      const updatedHabit = {
        ...mockDbHabit,
        frequency_type: 'weekly' as const,
        frequency_data: { daysPerWeek: 5 },
      }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: updatedHabit, error: null }) // update query
      mockSupabase.queueResult({ data: [], error: null }) // completions query

      const result = await habitsService.update(mockSupabase, 'habit-1', {
        frequency: { type: 'weekly', daysPerWeek: 5 },
      })

      expect(result.frequency).toEqual({ type: 'weekly', daysPerWeek: 5 })
    })

    it('updates habit tracking type', async () => {
      const updatedHabit = {
        ...mockDbHabit,
        tracking_type: 'quantitative' as const,
        tracking_target: 10,
        tracking_unit: 'reps',
      }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: updatedHabit, error: null }) // update query
      mockSupabase.queueResult({ data: [], error: null }) // completions query

      const result = await habitsService.update(mockSupabase, 'habit-1', {
        tracking: { type: 'quantitative', target: 10, unit: 'reps' },
      })

      expect(result.tracking).toEqual({
        type: 'quantitative',
        target: 10,
        unit: 'reps',
      })
    })
  })

  describe('delete', () => {
    it('deletes a habit', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ error: null })

      await habitsService.delete(mockSupabase, 'habit-1')

      expect(mockSupabase.from).toHaveBeenCalledWith('habits')
      expect(mockSupabase.mockChain.delete).toHaveBeenCalled()
      expect(mockSupabase.mockChain.eq).toHaveBeenCalledWith('id', 'habit-1')
    })

    it('throws error when delete fails', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ error: { message: 'Delete failed' } })

      await expect(habitsService.delete(mockSupabase, 'habit-1')).rejects.toEqual({
        message: 'Delete failed',
      })
    })
  })

  describe('archive', () => {
    it('archives a habit by setting archivedAt', async () => {
      const archivedHabit = {
        ...mockDbHabit,
        archived_at: '2024-01-20T00:00:00Z',
      }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: archivedHabit, error: null }) // update query
      mockSupabase.queueResult({ data: [], error: null }) // completions query

      const result = await habitsService.archive(mockSupabase, 'habit-1')

      expect(result.archivedAt).toBeDefined()
    })
  })

  describe('unarchive', () => {
    it('unarchives a habit by clearing archivedAt', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: mockDbHabit, error: null }) // update query
      mockSupabase.queueResult({ data: [], error: null }) // completions query

      const result = await habitsService.unarchive(mockSupabase, 'habit-1')

      expect(result.archivedAt).toBeUndefined()
    })
  })

  describe('reorder', () => {
    it('updates order for multiple habits', async () => {
      const mockSupabase = createMockSupabase()
      // Queue results for each update
      mockSupabase.queueResult({ error: null })
      mockSupabase.queueResult({ error: null })
      mockSupabase.queueResult({ error: null })

      await habitsService.reorder(mockSupabase, ['habit-3', 'habit-1', 'habit-2'])

      expect(mockSupabase.from).toHaveBeenCalledWith('habits')
      expect(mockSupabase.mockChain.update).toHaveBeenCalledTimes(3)
    })
  })
})

describe('completionsService', () => {
  describe('toggle', () => {
    it('adds completion when none exists', async () => {
      const mockSupabase = createMockSupabase()
      // Queue results in order
      mockSupabase.queueResult({ data: null, error: { code: 'PGRST116' } }) // check exists
      mockSupabase.queueResult({ data: mockDbCompletion, error: null }) // insert completion
      mockSupabase.queueResult({ data: [{ date: '2024-01-15' }], error: null }) // get completions for streak
      mockSupabase.queueResult({ data: { longest_streak: 5 }, error: null }) // get current streak
      mockSupabase.queueResult({ error: null }) // upsert streak
      mockSupabase.queueResult({ data: [{ current_streak: 5, longest_streak: 10 }], error: null }) // all streaks
      mockSupabase.queueResult({ data: { total_xp: 100 }, error: null }) // user stats
      mockSupabase.queueResult({ error: null }) // upsert user stats

      const result = await completionsService.toggle(mockSupabase, 'habit-1', '2024-01-15')

      expect(result.added).toBe(true)
      expect(result.completion).toBeDefined()
      expect(result.completion?.date).toBe('2024-01-15')
    })

    it('removes completion when one exists', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: mockDbCompletion, error: null }) // check exists
      mockSupabase.queueResult({ error: null }) // delete completion
      mockSupabase.queueResult({ data: [], error: null }) // get completions for streak
      mockSupabase.queueResult({ error: null }) // upsert streak
      mockSupabase.queueResult({ data: [], error: null }) // all streaks
      mockSupabase.queueResult({ data: null, error: null }) // user stats
      mockSupabase.queueResult({ error: null }) // upsert user stats

      const result = await completionsService.toggle(mockSupabase, 'habit-1', '2024-01-15')

      expect(result.added).toBe(false)
      expect(result.completion).toBeUndefined()
    })

    it('throws error when user not authenticated', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await expect(
        completionsService.toggle(mockSupabase, 'habit-1', '2024-01-15')
      ).rejects.toThrow('User not authenticated')
    })
  })

  describe('setCompletionValue', () => {
    it('updates existing completion value', async () => {
      const updatedCompletion = { ...mockDbCompletion, value: 5 }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: mockDbCompletion, error: null }) // check exists
      mockSupabase.queueResult({ data: updatedCompletion, error: null }) // update completion
      mockSupabase.queueResult({ data: [{ date: '2024-01-15' }], error: null }) // get completions for streak
      mockSupabase.queueResult({ data: { longest_streak: 1 }, error: null }) // get current streak
      mockSupabase.queueResult({ error: null }) // upsert streak
      mockSupabase.queueResult({ data: [{ current_streak: 1, longest_streak: 1 }], error: null }) // all streaks
      mockSupabase.queueResult({ data: null, error: null }) // user stats
      mockSupabase.queueResult({ error: null }) // upsert user stats

      const result = await completionsService.setCompletionValue(
        mockSupabase,
        'habit-1',
        '2024-01-15',
        5
      )

      expect(result.completion.value).toBe(5)
    })

    it('creates new completion when none exists', async () => {
      const newCompletion = { ...mockDbCompletion, value: 3 }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: null, error: { code: 'PGRST116' } }) // check exists
      mockSupabase.queueResult({ data: newCompletion, error: null }) // insert completion
      mockSupabase.queueResult({ data: [{ date: '2024-01-15' }], error: null }) // get completions for streak
      mockSupabase.queueResult({ data: null, error: null }) // get current streak (none)
      mockSupabase.queueResult({ error: null }) // upsert streak
      mockSupabase.queueResult({ data: [{ current_streak: 1, longest_streak: 1 }], error: null }) // all streaks
      mockSupabase.queueResult({ data: null, error: null }) // user stats
      mockSupabase.queueResult({ error: null }) // upsert user stats

      const result = await completionsService.setCompletionValue(
        mockSupabase,
        'habit-1',
        '2024-01-15',
        3
      )

      expect(result.completion.value).toBe(3)
    })
  })

  describe('removeCompletion', () => {
    it('removes a completion by habit and date', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ error: null }) // delete
      mockSupabase.queueResult({ data: [], error: null }) // get completions for streak
      mockSupabase.queueResult({ error: null }) // upsert streak
      mockSupabase.queueResult({ data: [], error: null }) // all streaks
      mockSupabase.queueResult({ data: null, error: null }) // user stats
      mockSupabase.queueResult({ error: null }) // upsert user stats

      await completionsService.removeCompletion(mockSupabase, 'habit-1', '2024-01-15')

      expect(mockSupabase.from).toHaveBeenCalledWith('habit_completions')
      expect(mockSupabase.mockChain.delete).toHaveBeenCalled()
    })
  })

  describe('getStreaks', () => {
    it('returns map of habit streaks', async () => {
      const mockStreaks = [
        { habit_id: 'habit-1', current_streak: 5, longest_streak: 10, user_id: 'test-user-id', last_completed_date: '2024-01-15' },
        { habit_id: 'habit-2', current_streak: 3, longest_streak: 7, user_id: 'test-user-id', last_completed_date: '2024-01-14' },
      ]

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: mockStreaks, error: null })

      const result = await completionsService.getStreaks(mockSupabase)

      expect(result.get('habit-1')).toEqual({ current: 5, longest: 10 })
      expect(result.get('habit-2')).toEqual({ current: 3, longest: 7 })
    })

    it('returns empty map when no streaks', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: null, error: null })

      const result = await completionsService.getStreaks(mockSupabase)

      expect(result.size).toBe(0)
    })
  })

  describe('updateStreak', () => {
    it('calculates correct streak for consecutive days', async () => {
      const mockSupabase = createMockSupabase()

      // Today's date for testing
      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]

      // Queue results
      mockSupabase.queueResult({ data: [{ date: today }, { date: yesterday }, { date: twoDaysAgo }], error: null }) // completions
      mockSupabase.queueResult({ data: { longest_streak: 2 }, error: null }) // current streak
      mockSupabase.queueResult({ error: null }) // upsert streak
      mockSupabase.queueResult({ data: [{ current_streak: 3, longest_streak: 3 }], error: null }) // all streaks
      mockSupabase.queueResult({ data: { total_xp: 100 }, error: null }) // user stats
      mockSupabase.queueResult({ error: null }) // upsert user stats

      await completionsService.updateStreak(mockSupabase, 'habit-1')

      // Verify upsert was called
      expect(mockSupabase.from).toHaveBeenCalledWith('habit_streaks')
      expect(mockSupabase.mockChain.upsert).toHaveBeenCalled()
    })

    it('resets streak when no completions', async () => {
      const mockSupabase = createMockSupabase()

      mockSupabase.queueResult({ data: [], error: null }) // no completions
      mockSupabase.queueResult({ error: null }) // upsert streak
      mockSupabase.queueResult({ data: [], error: null }) // all streaks
      mockSupabase.queueResult({ data: null, error: null }) // user stats
      mockSupabase.queueResult({ error: null }) // upsert user stats

      await completionsService.updateStreak(mockSupabase, 'habit-1')

      expect(mockSupabase.mockChain.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          current_streak: 0,
          longest_streak: 0,
          last_completed_date: null,
        })
      )
    })
  })
})
