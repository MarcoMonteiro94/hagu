import { describe, it, expect, vi } from 'vitest'
import { areasService, metricsService } from './areas.service'
import type { SupabaseClient } from '@supabase/supabase-js'

// Type for mock chain with all Supabase query methods
interface MockChain {
  select: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
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
  mockChain.order = vi.fn(() => mockChain)
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

// Sample DB data
const mockDbArea = {
  id: 'area-1',
  user_id: 'test-user-id',
  name: 'Health',
  slug: 'health',
  color: '#22c55e',
  icon: 'heart',
  is_default: true,
  order: 0,
  created_at: '2024-01-01T00:00:00Z',
}

const mockDbCustomArea = {
  id: 'area-2',
  user_id: 'test-user-id',
  name: 'Hobbies',
  slug: 'hobbies',
  color: '#8b5cf6',
  icon: 'gamepad',
  is_default: false,
  order: 1,
  created_at: '2024-01-02T00:00:00Z',
}

const mockDbMetricEntry = {
  id: 'metric-1',
  user_id: 'test-user-id',
  area_id: 'area-1',
  type: 'weight',
  value: 75.5,
  unit: 'kg',
  date: '2024-01-15',
  created_at: '2024-01-15T10:00:00Z',
}

describe('areasService', () => {
  describe('getAll', () => {
    it('fetches all life areas', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [mockDbArea, mockDbCustomArea], error: null })

      const result = await areasService.getAll(mockSupabase)

      expect(mockSupabase.from).toHaveBeenCalledWith('life_areas')
      expect(result).toHaveLength(2)
      expect(result[0]).toMatchObject({
        id: 'area-1',
        name: 'Health',
        slug: 'health',
        isDefault: true,
      })
    })

    it('returns empty array when no areas exist', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [], error: null })

      const result = await areasService.getAll(mockSupabase)

      expect(result).toEqual([])
    })

    it('throws error when fetch fails', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: null, error: { message: 'Database error' } })

      await expect(areasService.getAll(mockSupabase)).rejects.toEqual({
        message: 'Database error',
      })
    })
  })

  describe('getById', () => {
    it('fetches an area by id', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: mockDbArea, error: null })

      const result = await areasService.getById(mockSupabase, 'area-1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('area-1')
      expect(result?.name).toBe('Health')
      expect(result?.isDefault).toBe(true)
    })

    it('returns null when area not found', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: null, error: { code: 'PGRST116', message: 'Not found' } })

      const result = await areasService.getById(mockSupabase, 'non-existent')

      expect(result).toBeNull()
    })

    it('throws error for other errors', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: null, error: { code: 'OTHER', message: 'Some error' } })

      await expect(areasService.getById(mockSupabase, 'area-1')).rejects.toEqual({
        code: 'OTHER',
        message: 'Some error',
      })
    })
  })

  describe('getBySlug', () => {
    it('fetches an area by slug', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: mockDbArea, error: null })

      const result = await areasService.getBySlug(mockSupabase, 'health')

      expect(mockSupabase.mockChain.eq).toHaveBeenCalledWith('slug', 'health')
      expect(result).not.toBeNull()
      expect(result?.slug).toBe('health')
    })

    it('returns null when area not found by slug', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: null, error: { code: 'PGRST116', message: 'Not found' } })

      const result = await areasService.getBySlug(mockSupabase, 'non-existent')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('creates a new area with correct order', async () => {
      const newArea = { ...mockDbCustomArea, order: 2 }

      const mockSupabase = createMockSupabase()
      // getAll for max order
      mockSupabase.queueResult({ data: [mockDbArea, mockDbCustomArea], error: null })
      // insert
      mockSupabase.queueResult({ data: newArea, error: null })

      const result = await areasService.create(mockSupabase, {
        name: 'Hobbies',
        slug: 'hobbies',
        color: '#8b5cf6',
        icon: 'gamepad',
      })

      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
      expect(result.name).toBe('Hobbies')
      expect(result.isDefault).toBe(false)
    })

    it('creates first area with order 0', async () => {
      const firstArea = { ...mockDbCustomArea, order: 0 }

      const mockSupabase = createMockSupabase()
      // getAll returns empty
      mockSupabase.queueResult({ data: [], error: null })
      // insert
      mockSupabase.queueResult({ data: firstArea, error: null })

      const result = await areasService.create(mockSupabase, {
        name: 'First Area',
        slug: 'first-area',
        color: '#000',
        icon: 'star',
      })

      expect(result.order).toBe(0)
    })

    it('throws error when user not authenticated', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await expect(
        areasService.create(mockSupabase, {
          name: 'Test',
          slug: 'test',
          color: '#000',
          icon: 'test',
        })
      ).rejects.toThrow('User not authenticated')
    })
  })

  describe('update', () => {
    it('updates area name', async () => {
      const updatedArea = { ...mockDbArea, name: 'Wellness' }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: updatedArea, error: null })

      const result = await areasService.update(mockSupabase, 'area-1', {
        name: 'Wellness',
      })

      expect(result.name).toBe('Wellness')
    })

    it('updates area color and icon', async () => {
      const updatedArea = { ...mockDbArea, color: '#ef4444', icon: 'activity' }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: updatedArea, error: null })

      const result = await areasService.update(mockSupabase, 'area-1', {
        color: '#ef4444',
        icon: 'activity',
      })

      expect(result.color).toBe('#ef4444')
      expect(result.icon).toBe('activity')
    })

    it('updates area order', async () => {
      const updatedArea = { ...mockDbArea, order: 5 }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: updatedArea, error: null })

      const result = await areasService.update(mockSupabase, 'area-1', {
        order: 5,
      })

      expect(result.order).toBe(5)
    })
  })

  describe('delete', () => {
    it('deletes a custom area', async () => {
      const mockSupabase = createMockSupabase()
      // getById to check if default
      mockSupabase.queueResult({ data: mockDbCustomArea, error: null })
      // delete
      mockSupabase.queueResult({ error: null })

      await areasService.delete(mockSupabase, 'area-2')

      expect(mockSupabase.from).toHaveBeenCalledWith('life_areas')
      expect(mockSupabase.mockChain.delete).toHaveBeenCalled()
    })

    it('throws error when trying to delete default area', async () => {
      const mockSupabase = createMockSupabase()
      // getById returns default area
      mockSupabase.queueResult({ data: mockDbArea, error: null })

      await expect(areasService.delete(mockSupabase, 'area-1')).rejects.toThrow(
        'Cannot delete default area'
      )
    })

    it('throws error when delete fails', async () => {
      const mockSupabase = createMockSupabase()
      // getById
      mockSupabase.queueResult({ data: mockDbCustomArea, error: null })
      // delete fails
      mockSupabase.queueResult({ error: { message: 'Delete failed' } })

      await expect(areasService.delete(mockSupabase, 'area-2')).rejects.toEqual({
        message: 'Delete failed',
      })
    })
  })

  describe('reorder', () => {
    it('updates order for multiple areas', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ error: null })
      mockSupabase.queueResult({ error: null })
      mockSupabase.queueResult({ error: null })

      await areasService.reorder(mockSupabase, ['area-3', 'area-1', 'area-2'])

      expect(mockSupabase.from).toHaveBeenCalledWith('life_areas')
      expect(mockSupabase.mockChain.update).toHaveBeenCalledTimes(3)
    })

    it('throws error when reorder fails', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ error: null })
      mockSupabase.queueResult({ error: { message: 'Update failed' } })

      await expect(
        areasService.reorder(mockSupabase, ['area-1', 'area-2'])
      ).rejects.toEqual({
        message: 'Update failed',
      })
    })
  })
})

describe('metricsService', () => {
  describe('getByArea', () => {
    it('fetches metrics for an area', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [mockDbMetricEntry], error: null })

      const result = await metricsService.getByArea(mockSupabase, 'area-1')

      expect(mockSupabase.from).toHaveBeenCalledWith('metric_entries')
      expect(mockSupabase.mockChain.eq).toHaveBeenCalledWith('area_id', 'area-1')
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 'metric-1',
        areaId: 'area-1',
        type: 'weight',
        value: 75.5,
        unit: 'kg',
      })
    })

    it('returns empty array when no metrics exist', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [], error: null })

      const result = await metricsService.getByArea(mockSupabase, 'area-1')

      expect(result).toEqual([])
    })

    it('handles metrics without unit', async () => {
      const metricWithoutUnit = { ...mockDbMetricEntry, unit: null }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [metricWithoutUnit], error: null })

      const result = await metricsService.getByArea(mockSupabase, 'area-1')

      expect(result[0].unit).toBeUndefined()
    })
  })

  describe('getByAreaAndType', () => {
    it('fetches metrics by area and type', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [mockDbMetricEntry], error: null })

      const result = await metricsService.getByAreaAndType(mockSupabase, 'area-1', 'weight')

      expect(mockSupabase.mockChain.eq).toHaveBeenCalledWith('area_id', 'area-1')
      expect(mockSupabase.mockChain.eq).toHaveBeenCalledWith('type', 'weight')
      expect(result).toHaveLength(1)
    })

    it('returns empty array when no matching metrics', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [], error: null })

      const result = await metricsService.getByAreaAndType(mockSupabase, 'area-1', 'mood')

      expect(result).toEqual([])
    })
  })

  describe('create', () => {
    it('creates a metric entry', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: mockDbMetricEntry, error: null })

      const result = await metricsService.create(mockSupabase, {
        areaId: 'area-1',
        type: 'weight',
        value: 75.5,
        unit: 'kg',
        date: '2024-01-15',
      })

      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
      expect(result.type).toBe('weight')
      expect(result.value).toBe(75.5)
    })

    it('creates a metric entry without unit', async () => {
      const metricWithoutUnit = { ...mockDbMetricEntry, unit: null }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: metricWithoutUnit, error: null })

      const result = await metricsService.create(mockSupabase, {
        areaId: 'area-1',
        type: 'mood',
        value: 8,
        date: '2024-01-15',
      })

      expect(result.unit).toBeUndefined()
    })

    it('throws error when user not authenticated', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await expect(
        metricsService.create(mockSupabase, {
          areaId: 'area-1',
          type: 'weight',
          value: 75,
          date: '2024-01-15',
        })
      ).rejects.toThrow('User not authenticated')
    })
  })

  describe('update', () => {
    it('updates metric value', async () => {
      const updatedMetric = { ...mockDbMetricEntry, value: 74.0 }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: updatedMetric, error: null })

      const result = await metricsService.update(mockSupabase, 'metric-1', {
        value: 74.0,
      })

      expect(result.value).toBe(74.0)
    })

    it('updates metric date', async () => {
      const updatedMetric = { ...mockDbMetricEntry, date: '2024-01-20' }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: updatedMetric, error: null })

      const result = await metricsService.update(mockSupabase, 'metric-1', {
        date: '2024-01-20',
      })

      expect(result.date).toBe('2024-01-20')
    })

    it('updates metric type and unit', async () => {
      const updatedMetric = { ...mockDbMetricEntry, type: 'height', unit: 'cm', value: 180 }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: updatedMetric, error: null })

      const result = await metricsService.update(mockSupabase, 'metric-1', {
        type: 'height',
        unit: 'cm',
        value: 180,
      })

      expect(result.type).toBe('height')
      expect(result.unit).toBe('cm')
    })
  })

  describe('delete', () => {
    it('deletes a metric entry', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ error: null })

      await metricsService.delete(mockSupabase, 'metric-1')

      expect(mockSupabase.from).toHaveBeenCalledWith('metric_entries')
      expect(mockSupabase.mockChain.delete).toHaveBeenCalled()
      expect(mockSupabase.mockChain.eq).toHaveBeenCalledWith('id', 'metric-1')
    })

    it('throws error when delete fails', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ error: { message: 'Delete failed' } })

      await expect(metricsService.delete(mockSupabase, 'metric-1')).rejects.toEqual({
        message: 'Delete failed',
      })
    })
  })
})
