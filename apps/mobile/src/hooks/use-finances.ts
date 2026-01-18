import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  transactionsService,
  categoriesService,
  budgetsService,
  goalsService,
} from '@hagu/core'
import type {
  Transaction,
  TransactionCategory,
  Budget,
  FinancialGoal,
  GoalContribution,
  TransactionType,
  RecurrenceFrequency,
  MonthlyBalance,
  CategorySummary,
} from '@hagu/core'
import { supabase } from '@/lib/supabase'

// Query keys
const TRANSACTIONS_KEY = ['transactions']
const CATEGORIES_KEY = ['categories']
const BUDGETS_KEY = ['budgets']
const GOALS_KEY = ['financial-goals']

// ============ Transactions Queries ============

export function useTransactionsQuery() {
  return useQuery({
    queryKey: TRANSACTIONS_KEY,
    queryFn: () => transactionsService.getAll(supabase),
  })
}

export function useTransactionsByMonthQuery(month: string) {
  return useQuery({
    queryKey: [...TRANSACTIONS_KEY, 'month', month],
    queryFn: () => transactionsService.getByMonth(supabase, month),
    enabled: !!month,
  })
}

export function useTransactionQuery(id: string | undefined) {
  return useQuery({
    queryKey: [...TRANSACTIONS_KEY, id],
    queryFn: () => (id ? transactionsService.getById(supabase, id) : null),
    enabled: !!id,
  })
}

// ============ Transactions Mutations ============

export interface CreateTransactionData {
  type: TransactionType
  amount: number
  categoryId: string
  description: string
  date: string
  paymentMethod?: string
  tags?: string[]
  isRecurring: boolean
  recurrence?: {
    frequency: RecurrenceFrequency
    nextDate?: string
    endDate?: string
  }
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (transaction: CreateTransactionData) =>
      transactionsService.create(supabase, transaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY })
    },
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<CreateTransactionData>
    }) => transactionsService.update(supabase, id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY })
      queryClient.invalidateQueries({ queryKey: [...TRANSACTIONS_KEY, id] })
    },
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => transactionsService.delete(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY })
    },
  })
}

export function useDeleteManyTransactions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => transactionsService.delete(supabase, id)))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSACTIONS_KEY })
    },
  })
}

// ============ Categories Queries ============

export function useCategoriesQuery() {
  return useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: () => categoriesService.getAll(supabase),
  })
}

// ============ Categories Mutations ============

export interface CreateCategoryData {
  name: string
  nameKey: string
  type: TransactionType
  icon: string
  color: string
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (category: CreateCategoryData) =>
      categoriesService.create(supabase, category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => categoriesService.delete(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY })
    },
  })
}

// ============ Budgets Queries ============

export function useBudgetsQuery() {
  return useQuery({
    queryKey: BUDGETS_KEY,
    queryFn: () => budgetsService.getAll(supabase),
  })
}

export function useBudgetsByMonthQuery(month: string) {
  return useQuery({
    queryKey: [...BUDGETS_KEY, 'month', month],
    queryFn: () => budgetsService.getByMonth(supabase, month),
    enabled: !!month,
  })
}

// ============ Budgets Mutations ============

export function useUpsertBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      categoryId,
      monthlyLimit,
      month,
    }: {
      categoryId: string
      monthlyLimit: number
      month: string
    }) => budgetsService.upsert(supabase, categoryId, monthlyLimit, month),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGETS_KEY })
    },
  })
}

export function useDeleteBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => budgetsService.delete(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BUDGETS_KEY })
    },
  })
}

// ============ Goals Queries ============

export function useGoalsQuery() {
  return useQuery({
    queryKey: GOALS_KEY,
    queryFn: () => goalsService.getAll(supabase),
  })
}

export function useGoalQuery(id: string | undefined) {
  return useQuery({
    queryKey: [...GOALS_KEY, id],
    queryFn: () => (id ? goalsService.getById(supabase, id) : null),
    enabled: !!id,
  })
}

// ============ Goals Mutations ============

export interface CreateGoalData {
  name: string
  description?: string
  targetAmount: number
  deadline?: string
  color: string
  icon?: string
}

export function useCreateGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (goal: CreateGoalData) => goalsService.create(supabase, goal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOALS_KEY })
    },
  })
}

export function useUpdateGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<CreateGoalData>
    }) => goalsService.update(supabase, id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: GOALS_KEY })
      queryClient.invalidateQueries({ queryKey: [...GOALS_KEY, id] })
    },
  })
}

export function useDeleteGoal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => goalsService.delete(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GOALS_KEY })
    },
  })
}

export function useAddContribution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      goalId,
      amount,
      note,
    }: {
      goalId: string
      amount: number
      note?: string
    }) => goalsService.addContribution(supabase, goalId, amount, note),
    onSuccess: (_, { goalId }) => {
      queryClient.invalidateQueries({ queryKey: GOALS_KEY })
      queryClient.invalidateQueries({ queryKey: [...GOALS_KEY, goalId] })
    },
  })
}

// ============ Derived Data Hooks ============

export interface MonthlyStats {
  totalIncome: number
  totalExpenses: number
  balance: number
  transactionCount: number
}

export function useMonthlyStats(
  transactions: Transaction[] | undefined,
  month: string
): MonthlyStats {
  return useMemo(() => {
    if (!transactions) {
      return { totalIncome: 0, totalExpenses: 0, balance: 0, transactionCount: 0 }
    }

    const filtered = transactions.filter((t) => t.date.startsWith(month))

    const totalIncome = filtered
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpenses = filtered
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      transactionCount: filtered.length,
    }
  }, [transactions, month])
}

export function useCategorySummary(
  transactions: Transaction[] | undefined,
  categories: TransactionCategory[] | undefined,
  type: TransactionType
): CategorySummary[] {
  return useMemo(() => {
    if (!transactions || !categories) return []

    const filtered = transactions.filter((t) => t.type === type)
    const total = filtered.reduce((sum, t) => sum + t.amount, 0)

    const summaryMap = new Map<string, { total: number; count: number }>()

    filtered.forEach((t) => {
      const existing = summaryMap.get(t.categoryId) || { total: 0, count: 0 }
      summaryMap.set(t.categoryId, {
        total: existing.total + t.amount,
        count: existing.count + 1,
      })
    })

    return Array.from(summaryMap.entries())
      .map(([categoryId, data]) => ({
        categoryId,
        total: data.total,
        count: data.count,
        percentage: total > 0 ? (data.total / total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total)
  }, [transactions, categories, type])
}

export function useBudgetProgress(
  transactions: Transaction[] | undefined,
  budgets: Budget[] | undefined,
  categories: TransactionCategory[] | undefined,
  month: string
) {
  return useMemo(() => {
    if (!transactions || !budgets || !categories) return []

    const monthBudgets = budgets.filter((b) => b.month === month)
    const monthExpenses = transactions.filter(
      (t) => t.type === 'expense' && t.date.startsWith(month)
    )

    return monthBudgets.map((budget) => {
      const category = categories.find((c) => c.id === budget.categoryId)
      const spent = monthExpenses
        .filter((t) => t.categoryId === budget.categoryId)
        .reduce((sum, t) => sum + t.amount, 0)

      const percentage = budget.monthlyLimit > 0 ? (spent / budget.monthlyLimit) * 100 : 0
      const remaining = budget.monthlyLimit - spent
      const isOverBudget = spent > budget.monthlyLimit

      return {
        budget,
        category,
        spent,
        percentage: Math.min(percentage, 100),
        remaining,
        isOverBudget,
      }
    })
  }, [transactions, budgets, categories, month])
}

// Group transactions by date
export function useGroupedTransactions(transactions: Transaction[] | undefined) {
  return useMemo(() => {
    if (!transactions) return []

    const groups = new Map<string, Transaction[]>()

    transactions.forEach((t) => {
      const existing = groups.get(t.date) || []
      groups.set(t.date, [...existing, t])
    })

    return Array.from(groups.entries())
      .map(([date, items]) => ({ date, transactions: items }))
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [transactions])
}

// Re-export types
export type {
  Transaction,
  TransactionCategory,
  Budget,
  FinancialGoal,
  GoalContribution,
  TransactionType,
  RecurrenceFrequency,
  MonthlyBalance,
  CategorySummary,
}
