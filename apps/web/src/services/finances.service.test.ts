import { describe, it, expect, vi } from 'vitest'
import {
  transactionsService,
  categoriesService,
  budgetsService,
  goalsService,
} from './finances.service'
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
  gte: ReturnType<typeof vi.fn>
  lte: ReturnType<typeof vi.fn>
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
  mockChain.upsert = vi.fn(() => mockChain)
  mockChain.eq = vi.fn(() => mockChain)
  mockChain.in = vi.fn(() => mockChain)
  mockChain.gte = vi.fn(() => mockChain)
  mockChain.lte = vi.fn(() => mockChain)
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
const mockDbTransaction = {
  id: 'txn-1',
  user_id: 'test-user-id',
  category_id: 'cat-1',
  type: 'expense' as const,
  amount: 150.0,
  description: 'Groceries',
  date: '2024-01-15',
  payment_method: 'credit_card',
  tags: ['food', 'essentials'],
  is_recurring: false,
  recurrence_frequency: null,
  recurrence_next_date: null,
  recurrence_end_date: null,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: null,
}

const mockDbCategory = {
  id: 'cat-1',
  user_id: 'test-user-id',
  name: 'Food',
  name_key: 'food',
  type: 'expense' as const,
  icon: 'utensils',
  color: '#ef4444',
  is_custom: false,
  created_at: '2024-01-01T00:00:00Z',
}

const mockDbBudget = {
  id: 'budget-1',
  user_id: 'test-user-id',
  category_id: 'cat-1',
  monthly_limit: 500,
  month: '2024-01',
}

const mockDbGoal = {
  id: 'goal-1',
  user_id: 'test-user-id',
  name: 'Emergency Fund',
  description: 'Save for emergencies',
  target_amount: 10000,
  current_amount: 2500,
  deadline: '2024-12-31',
  color: '#22c55e',
  icon: 'piggy-bank',
  created_at: '2024-01-01T00:00:00Z',
  completed_at: null,
}

const mockDbContribution = {
  id: 'contrib-1',
  goal_id: 'goal-1',
  user_id: 'test-user-id',
  amount: 500,
  date: '2024-01-15',
  note: 'Monthly savings',
  created_at: '2024-01-15T10:00:00Z',
}

describe('transactionsService', () => {
  describe('getAll', () => {
    it('fetches all transactions', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [mockDbTransaction], error: null })

      const result = await transactionsService.getAll(mockSupabase)

      expect(mockSupabase.from).toHaveBeenCalledWith('transactions')
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 'txn-1',
        type: 'expense',
        amount: 150,
        description: 'Groceries',
        categoryId: 'cat-1',
      })
    })

    it('returns empty array when no transactions exist', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [], error: null })

      const result = await transactionsService.getAll(mockSupabase)

      expect(result).toEqual([])
    })

    it('throws error when fetch fails', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: null, error: { message: 'Database error' } })

      await expect(transactionsService.getAll(mockSupabase)).rejects.toEqual({
        message: 'Database error',
      })
    })
  })

  describe('getByMonth', () => {
    it('fetches transactions for a specific month', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [mockDbTransaction], error: null })

      const result = await transactionsService.getByMonth(mockSupabase, '2024-01')

      expect(mockSupabase.mockChain.gte).toHaveBeenCalledWith('date', '2024-01-01')
      expect(mockSupabase.mockChain.lte).toHaveBeenCalledWith('date', '2024-01-31')
      expect(result).toHaveLength(1)
    })

    it('handles months with different days correctly', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [], error: null })

      await transactionsService.getByMonth(mockSupabase, '2024-02')

      // February 2024 has 29 days (leap year)
      expect(mockSupabase.mockChain.lte).toHaveBeenCalledWith('date', '2024-02-29')
    })
  })

  describe('getById', () => {
    it('fetches a transaction by id', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: mockDbTransaction, error: null })

      const result = await transactionsService.getById(mockSupabase, 'txn-1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('txn-1')
      expect(result?.amount).toBe(150)
    })

    it('returns null when transaction not found', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: null, error: { code: 'PGRST116', message: 'Not found' } })

      const result = await transactionsService.getById(mockSupabase, 'non-existent')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('creates a transaction', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: mockDbTransaction, error: null })

      const result = await transactionsService.create(mockSupabase, {
        type: 'expense',
        amount: 150,
        categoryId: 'cat-1',
        description: 'Groceries',
        date: '2024-01-15',
        paymentMethod: 'credit_card',
        tags: ['food', 'essentials'],
        isRecurring: false,
      })

      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
      expect(result.amount).toBe(150)
      expect(result.type).toBe('expense')
    })

    it('creates a recurring transaction', async () => {
      const recurringTransaction = {
        ...mockDbTransaction,
        is_recurring: true,
        recurrence_frequency: 'monthly' as const,
        recurrence_next_date: '2024-02-15',
        recurrence_end_date: null,
      }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: recurringTransaction, error: null })

      const result = await transactionsService.create(mockSupabase, {
        type: 'expense',
        amount: 150,
        categoryId: 'cat-1',
        description: 'Subscription',
        date: '2024-01-15',
        tags: [],
        isRecurring: true,
        recurrence: {
          frequency: 'monthly',
          nextDate: '2024-02-15',
        },
      })

      expect(result.isRecurring).toBe(true)
      expect(result.recurrence?.frequency).toBe('monthly')
    })

    it('throws error when user not authenticated', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await expect(
        transactionsService.create(mockSupabase, {
          type: 'expense',
          amount: 100,
          categoryId: 'cat-1',
          description: 'Test',
          date: '2024-01-15',
          tags: [],
          isRecurring: false,
        })
      ).rejects.toThrow('User not authenticated')
    })
  })

  describe('update', () => {
    it('updates transaction amount', async () => {
      const updatedTransaction = { ...mockDbTransaction, amount: 200 }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: updatedTransaction, error: null })

      const result = await transactionsService.update(mockSupabase, 'txn-1', {
        amount: 200,
      })

      expect(result.amount).toBe(200)
    })

    it('updates transaction description', async () => {
      const updatedTransaction = { ...mockDbTransaction, description: 'Updated groceries' }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: updatedTransaction, error: null })

      const result = await transactionsService.update(mockSupabase, 'txn-1', {
        description: 'Updated groceries',
      })

      expect(result.description).toBe('Updated groceries')
    })

    it('updates recurrence settings', async () => {
      const recurringTransaction = {
        ...mockDbTransaction,
        is_recurring: true,
        recurrence_frequency: 'weekly' as const,
        recurrence_next_date: '2024-01-22',
        recurrence_end_date: '2024-06-30',
      }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: recurringTransaction, error: null })

      const result = await transactionsService.update(mockSupabase, 'txn-1', {
        isRecurring: true,
        recurrence: {
          frequency: 'weekly',
          nextDate: '2024-01-22',
          endDate: '2024-06-30',
        },
      })

      expect(result.recurrence?.frequency).toBe('weekly')
      expect(result.recurrence?.endDate).toBe('2024-06-30')
    })
  })

  describe('delete', () => {
    it('deletes a transaction', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ error: null })

      await transactionsService.delete(mockSupabase, 'txn-1')

      expect(mockSupabase.from).toHaveBeenCalledWith('transactions')
      expect(mockSupabase.mockChain.delete).toHaveBeenCalled()
      expect(mockSupabase.mockChain.eq).toHaveBeenCalledWith('id', 'txn-1')
    })

    it('throws error when delete fails', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ error: { message: 'Delete failed' } })

      await expect(transactionsService.delete(mockSupabase, 'txn-1')).rejects.toEqual({
        message: 'Delete failed',
      })
    })
  })
})

describe('categoriesService', () => {
  describe('getAll', () => {
    it('fetches all categories', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [mockDbCategory], error: null })

      const result = await categoriesService.getAll(mockSupabase)

      expect(mockSupabase.from).toHaveBeenCalledWith('transaction_categories')
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 'cat-1',
        name: 'Food',
        type: 'expense',
        icon: 'utensils',
      })
    })

    it('returns empty array when no categories exist', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [], error: null })

      const result = await categoriesService.getAll(mockSupabase)

      expect(result).toEqual([])
    })
  })

  describe('create', () => {
    it('creates a custom category', async () => {
      const customCategory = { ...mockDbCategory, is_custom: true, name: 'Hobbies' }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: customCategory, error: null })

      const result = await categoriesService.create(mockSupabase, {
        name: 'Hobbies',
        nameKey: 'hobbies',
        type: 'expense',
        icon: 'gamepad',
        color: '#8b5cf6',
      })

      expect(result.name).toBe('Hobbies')
      expect(result.isCustom).toBe(true)
    })

    it('throws error when user not authenticated', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await expect(
        categoriesService.create(mockSupabase, {
          name: 'Test',
          nameKey: 'test',
          type: 'expense',
          icon: 'test',
          color: '#000',
        })
      ).rejects.toThrow('User not authenticated')
    })
  })

  describe('delete', () => {
    it('deletes a category', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ error: null })

      await categoriesService.delete(mockSupabase, 'cat-1')

      expect(mockSupabase.from).toHaveBeenCalledWith('transaction_categories')
      expect(mockSupabase.mockChain.delete).toHaveBeenCalled()
    })
  })
})

describe('budgetsService', () => {
  describe('getAll', () => {
    it('fetches all budgets', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [mockDbBudget], error: null })

      const result = await budgetsService.getAll(mockSupabase)

      expect(mockSupabase.from).toHaveBeenCalledWith('budgets')
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 'budget-1',
        categoryId: 'cat-1',
        monthlyLimit: 500,
        month: '2024-01',
      })
    })
  })

  describe('getByMonth', () => {
    it('fetches budgets for a specific month', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [mockDbBudget], error: null })

      const result = await budgetsService.getByMonth(mockSupabase, '2024-01')

      expect(mockSupabase.mockChain.eq).toHaveBeenCalledWith('month', '2024-01')
      expect(result).toHaveLength(1)
    })

    it('returns empty array when no budgets for month', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [], error: null })

      const result = await budgetsService.getByMonth(mockSupabase, '2024-02')

      expect(result).toEqual([])
    })
  })

  describe('upsert', () => {
    it('creates a new budget', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: mockDbBudget, error: null })

      const result = await budgetsService.upsert(mockSupabase, 'cat-1', 500, '2024-01')

      expect(mockSupabase.mockChain.upsert).toHaveBeenCalled()
      expect(result.monthlyLimit).toBe(500)
    })

    it('updates an existing budget', async () => {
      const updatedBudget = { ...mockDbBudget, monthly_limit: 750 }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: updatedBudget, error: null })

      const result = await budgetsService.upsert(mockSupabase, 'cat-1', 750, '2024-01')

      expect(result.monthlyLimit).toBe(750)
    })

    it('throws error when user not authenticated', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await expect(
        budgetsService.upsert(mockSupabase, 'cat-1', 500, '2024-01')
      ).rejects.toThrow('User not authenticated')
    })
  })

  describe('delete', () => {
    it('deletes a budget', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ error: null })

      await budgetsService.delete(mockSupabase, 'budget-1')

      expect(mockSupabase.from).toHaveBeenCalledWith('budgets')
      expect(mockSupabase.mockChain.delete).toHaveBeenCalled()
    })
  })
})

describe('goalsService', () => {
  describe('getAll', () => {
    it('fetches all goals with contributions', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [mockDbGoal], error: null }) // goals query
      mockSupabase.queueResult({ data: [mockDbContribution], error: null }) // contributions query

      const result = await goalsService.getAll(mockSupabase)

      expect(mockSupabase.from).toHaveBeenCalledWith('financial_goals')
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        id: 'goal-1',
        name: 'Emergency Fund',
        targetAmount: 10000,
        currentAmount: 2500,
      })
      expect(result[0].contributions).toHaveLength(1)
    })

    it('returns empty array when no goals exist', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: [], error: null })

      const result = await goalsService.getAll(mockSupabase)

      expect(result).toEqual([])
    })
  })

  describe('getById', () => {
    it('fetches a goal by id with contributions', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: mockDbGoal, error: null }) // goal query
      mockSupabase.queueResult({ data: [mockDbContribution], error: null }) // contributions query

      const result = await goalsService.getById(mockSupabase, 'goal-1')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('goal-1')
      expect(result?.contributions).toHaveLength(1)
    })

    it('returns null when goal not found', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: null, error: { code: 'PGRST116', message: 'Not found' } })

      const result = await goalsService.getById(mockSupabase, 'non-existent')

      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('creates a goal with initial amount zero', async () => {
      const newGoal = { ...mockDbGoal, current_amount: 0 }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: newGoal, error: null })

      const result = await goalsService.create(mockSupabase, {
        name: 'Emergency Fund',
        description: 'Save for emergencies',
        targetAmount: 10000,
        deadline: '2024-12-31',
        color: '#22c55e',
        icon: 'piggy-bank',
      })

      expect(result.name).toBe('Emergency Fund')
      expect(result.currentAmount).toBe(0)
      expect(result.contributions).toEqual([])
    })

    it('throws error when user not authenticated', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await expect(
        goalsService.create(mockSupabase, {
          name: 'Test',
          targetAmount: 1000,
          color: '#000',
        })
      ).rejects.toThrow('User not authenticated')
    })
  })

  describe('update', () => {
    it('updates goal name and description', async () => {
      const updatedGoal = {
        ...mockDbGoal,
        name: 'Updated Fund',
        description: 'Updated description',
      }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: updatedGoal, error: null }) // update query
      mockSupabase.queueResult({ data: [], error: null }) // contributions query

      const result = await goalsService.update(mockSupabase, 'goal-1', {
        name: 'Updated Fund',
        description: 'Updated description',
      })

      expect(result.name).toBe('Updated Fund')
      expect(result.description).toBe('Updated description')
    })

    it('updates target amount', async () => {
      const updatedGoal = { ...mockDbGoal, target_amount: 15000 }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: updatedGoal, error: null }) // update query
      mockSupabase.queueResult({ data: [], error: null }) // contributions query

      const result = await goalsService.update(mockSupabase, 'goal-1', {
        targetAmount: 15000,
      })

      expect(result.targetAmount).toBe(15000)
    })

    it('marks goal as completed', async () => {
      const completedGoal = {
        ...mockDbGoal,
        completed_at: '2024-01-20T10:00:00Z',
      }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: completedGoal, error: null }) // update query
      mockSupabase.queueResult({ data: [], error: null }) // contributions query

      const result = await goalsService.update(mockSupabase, 'goal-1', {
        completedAt: '2024-01-20T10:00:00Z',
      })

      expect(result.completedAt).toBe('2024-01-20T10:00:00Z')
    })
  })

  describe('delete', () => {
    it('deletes a goal', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ error: null })

      await goalsService.delete(mockSupabase, 'goal-1')

      expect(mockSupabase.from).toHaveBeenCalledWith('financial_goals')
      expect(mockSupabase.mockChain.delete).toHaveBeenCalled()
    })
  })

  describe('addContribution', () => {
    it('adds contribution and updates goal current amount', async () => {
      const updatedGoal = { ...mockDbGoal, current_amount: 3000 }
      const newContribution = { ...mockDbContribution, amount: 500 }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: mockDbGoal, error: null }) // get current goal
      mockSupabase.queueResult({ data: newContribution, error: null }) // insert contribution
      mockSupabase.queueResult({ data: updatedGoal, error: null }) // update goal amount
      mockSupabase.queueResult({ data: [mockDbContribution, newContribution], error: null }) // get all contributions

      const result = await goalsService.addContribution(mockSupabase, 'goal-1', 500, 'Monthly savings')

      expect(result.contribution.amount).toBe(500)
      expect(result.goal.currentAmount).toBe(3000)
    })

    it('marks goal as completed when target is reached', async () => {
      const almostCompleteGoal = { ...mockDbGoal, current_amount: 9500, target_amount: 10000 }
      const completedGoal = {
        ...almostCompleteGoal,
        current_amount: 10000,
        completed_at: expect.any(String),
      }
      const finalContribution = { ...mockDbContribution, amount: 500 }

      const mockSupabase = createMockSupabase()
      mockSupabase.queueResult({ data: almostCompleteGoal, error: null }) // get current goal
      mockSupabase.queueResult({ data: finalContribution, error: null }) // insert contribution
      mockSupabase.queueResult({ data: completedGoal, error: null }) // update goal
      mockSupabase.queueResult({ data: [finalContribution], error: null }) // get all contributions

      const result = await goalsService.addContribution(mockSupabase, 'goal-1', 500)

      expect(result.goal.currentAmount).toBe(10000)
    })

    it('throws error when user not authenticated', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.auth.getUser = vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      })

      await expect(
        goalsService.addContribution(mockSupabase, 'goal-1', 100)
      ).rejects.toThrow('User not authenticated')
    })
  })
})
