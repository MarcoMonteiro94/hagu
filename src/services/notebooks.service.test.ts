import { describe, it, expect, vi, beforeEach } from 'vitest'
import { notebooksService } from './notebooks.service'
import type { SupabaseClient } from '@supabase/supabase-js'

// Mock Supabase client factory
function createMockSupabase(overrides: Record<string, unknown> = {}) {
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    ...overrides,
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
  } as unknown as SupabaseClient & { mockChain: typeof mockChain }
}

describe('notebooksService', () => {
  describe('getAll', () => {
    it('should fetch all notebooks ordered by order', async () => {
      const mockData = [
        {
          id: '1',
          user_id: 'test-user-id',
          title: 'Notebook 1',
          description: null,
          color: '#6366f1',
          icon: null,
          order: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          user_id: 'test-user-id',
          title: 'Notebook 2',
          description: 'Description',
          color: '#10b981',
          icon: 'book',
          order: 1,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ]

      const mockSupabase = createMockSupabase()
      mockSupabase.mockChain.order.mockResolvedValue({ data: mockData, error: null })

      const result = await notebooksService.getAll(mockSupabase)

      expect(mockSupabase.from).toHaveBeenCalledWith('notebooks')
      expect(mockSupabase.mockChain.select).toHaveBeenCalledWith('*')
      expect(mockSupabase.mockChain.order).toHaveBeenCalledWith('order', { ascending: true })
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: '1',
        userId: 'test-user-id',
        title: 'Notebook 1',
        description: undefined,
        color: '#6366f1',
        icon: undefined,
        order: 0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      })
    })

    it('should throw error when fetch fails', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.mockChain.order.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      await expect(notebooksService.getAll(mockSupabase)).rejects.toEqual({
        message: 'Database error',
      })
    })
  })

  describe('getById', () => {
    it('should fetch a notebook by id', async () => {
      const mockData = {
        id: '1',
        user_id: 'test-user-id',
        title: 'Test Notebook',
        description: 'Test description',
        color: '#6366f1',
        icon: 'book',
        order: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const mockSupabase = createMockSupabase()
      mockSupabase.mockChain.single.mockResolvedValue({ data: mockData, error: null })

      const result = await notebooksService.getById(mockSupabase, '1')

      expect(mockSupabase.from).toHaveBeenCalledWith('notebooks')
      expect(mockSupabase.mockChain.eq).toHaveBeenCalledWith('id', '1')
      expect(result).toEqual({
        id: '1',
        userId: 'test-user-id',
        title: 'Test Notebook',
        description: 'Test description',
        color: '#6366f1',
        icon: 'book',
        order: 0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      })
    })

    it('should return null when notebook not found', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.mockChain.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      })

      const result = await notebooksService.getById(mockSupabase, 'non-existent')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should create a notebook with user_id', async () => {
      const mockCreatedData = {
        id: 'new-id',
        user_id: 'test-user-id',
        title: 'New Notebook',
        description: null,
        color: '#6366f1',
        icon: null,
        order: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const mockSupabase = createMockSupabase()
      // Mock max order query
      mockSupabase.mockChain.single.mockResolvedValueOnce({ data: null, error: null })
      // Mock insert
      mockSupabase.mockChain.single.mockResolvedValueOnce({ data: mockCreatedData, error: null })

      const result = await notebooksService.create(mockSupabase, {
        title: 'New Notebook',
      })

      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
      expect(result.title).toBe('New Notebook')
      expect(result.userId).toBe('test-user-id')
    })

    it('should throw error when user not authenticated', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await expect(
        notebooksService.create(mockSupabase, { title: 'Test' })
      ).rejects.toThrow('User not authenticated')
    })
  })

  describe('update', () => {
    it('should update notebook fields', async () => {
      const mockUpdatedData = {
        id: '1',
        user_id: 'test-user-id',
        title: 'Updated Title',
        description: 'Updated description',
        color: '#10b981',
        icon: 'star',
        order: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      }

      const mockSupabase = createMockSupabase()
      mockSupabase.mockChain.single.mockResolvedValue({ data: mockUpdatedData, error: null })

      const result = await notebooksService.update(mockSupabase, '1', {
        title: 'Updated Title',
        description: 'Updated description',
        color: '#10b981',
        icon: 'star',
      })

      expect(mockSupabase.from).toHaveBeenCalledWith('notebooks')
      expect(result.title).toBe('Updated Title')
      expect(result.description).toBe('Updated description')
    })
  })

  describe('delete', () => {
    it('should delete a notebook', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.mockChain.eq.mockResolvedValue({ error: null })

      await notebooksService.delete(mockSupabase, '1')

      expect(mockSupabase.from).toHaveBeenCalledWith('notebooks')
      expect(mockSupabase.mockChain.delete).toHaveBeenCalled()
      expect(mockSupabase.mockChain.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when delete fails', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.mockChain.eq.mockResolvedValue({
        error: { message: 'Delete failed' },
      })

      await expect(notebooksService.delete(mockSupabase, '1')).rejects.toEqual({
        message: 'Delete failed',
      })
    })
  })

  describe('getPages', () => {
    it('should fetch pages for a notebook', async () => {
      const mockData = [
        {
          id: 'page-1',
          notebook_id: 'notebook-1',
          title: 'Page 1',
          order: 0,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'page-2',
          notebook_id: 'notebook-1',
          title: 'Page 2',
          order: 1,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ]

      const mockSupabase = createMockSupabase()
      mockSupabase.mockChain.order.mockResolvedValue({ data: mockData, error: null })

      const result = await notebooksService.getPages(mockSupabase, 'notebook-1')

      expect(mockSupabase.from).toHaveBeenCalledWith('notebook_pages')
      expect(mockSupabase.mockChain.eq).toHaveBeenCalledWith('notebook_id', 'notebook-1')
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: 'page-1',
        notebookId: 'notebook-1',
        title: 'Page 1',
        order: 0,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      })
    })
  })

  describe('createPage', () => {
    it('should create a page with user_id', async () => {
      const mockCreatedData = {
        id: 'new-page-id',
        notebook_id: 'notebook-1',
        user_id: 'test-user-id',
        title: 'New Page',
        content: [],
        order: 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const mockSupabase = createMockSupabase()
      // Mock max order query
      mockSupabase.mockChain.single.mockResolvedValueOnce({ data: null, error: null })
      // Mock insert
      mockSupabase.mockChain.single.mockResolvedValueOnce({ data: mockCreatedData, error: null })

      const result = await notebooksService.createPage(mockSupabase, {
        notebookId: 'notebook-1',
        title: 'New Page',
      })

      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
      expect(result.title).toBe('New Page')
      expect(result.notebookId).toBe('notebook-1')
    })
  })
})
