'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import {
  transactionsService,
  categoriesService,
  budgetsService,
  goalsService,
} from '@/services/finances.service'
import type {
  Transaction,
  TransactionCategory,
  Budget,
  FinancialGoal,
} from '@/types/finances'

// ============================================
// QUERY KEYS
// ============================================
export const financesKeys = {
  all: ['finances'] as const,
  transactions: () => [...financesKeys.all, 'transactions'] as const,
  transactionsList: () => [...financesKeys.transactions(), 'list'] as const,
  transactionsByMonth: (month: string) => [...financesKeys.transactions(), 'month', month] as const,
  transactionDetail: (id: string) => [...financesKeys.transactions(), 'detail', id] as const,
  categories: () => [...financesKeys.all, 'categories'] as const,
  budgets: () => [...financesKeys.all, 'budgets'] as const,
  budgetsByMonth: (month: string) => [...financesKeys.budgets(), 'month', month] as const,
  goals: () => [...financesKeys.all, 'goals'] as const,
  goalsList: () => [...financesKeys.goals(), 'list'] as const,
  goalDetail: (id: string) => [...financesKeys.goals(), 'detail', id] as const,
}

// ============================================
// TRANSACTIONS HOOKS
// ============================================

export function useTransactions() {
  const supabase = createClient()

  return useQuery({
    queryKey: financesKeys.transactionsList(),
    queryFn: () => transactionsService.getAll(supabase),
  })
}

export function useTransactionsByMonth(month: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: financesKeys.transactionsByMonth(month),
    queryFn: () => transactionsService.getByMonth(supabase, month),
    enabled: !!month,
  })
}

export function useTransaction(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: financesKeys.transactionDetail(id),
    queryFn: () => transactionsService.getById(supabase, id),
    enabled: !!id,
  })
}

export function useCreateTransaction() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (transaction: Omit<Transaction, 'id' | 'createdAt'>) =>
      transactionsService.create(supabase, transaction),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financesKeys.transactions() })
    },
  })
}

export function useUpdateTransaction() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>
    }) => transactionsService.update(supabase, id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: financesKeys.transactions() })
      queryClient.invalidateQueries({ queryKey: financesKeys.transactionDetail(data.id) })
    },
  })
}

export function useDeleteTransaction() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => transactionsService.delete(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financesKeys.transactions() })
    },
  })
}

// ============================================
// CUSTOM CATEGORIES HOOKS
// ============================================

export function useCustomCategories() {
  const supabase = createClient()

  return useQuery({
    queryKey: financesKeys.categories(),
    queryFn: () => categoriesService.getAll(supabase),
  })
}

export function useCreateCategory() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (category: Omit<TransactionCategory, 'id' | 'isCustom'>) =>
      categoriesService.create(supabase, category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financesKeys.categories() })
    },
  })
}

export function useDeleteCategory() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => categoriesService.delete(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financesKeys.categories() })
    },
  })
}

// ============================================
// BUDGETS HOOKS
// ============================================

export function useBudgets() {
  const supabase = createClient()

  return useQuery({
    queryKey: financesKeys.budgets(),
    queryFn: () => budgetsService.getAll(supabase),
  })
}

export function useBudgetsByMonth(month: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: financesKeys.budgetsByMonth(month),
    queryFn: () => budgetsService.getByMonth(supabase, month),
    enabled: !!month,
  })
}

export function useUpsertBudget() {
  const supabase = createClient()
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
      queryClient.invalidateQueries({ queryKey: financesKeys.budgets() })
    },
  })
}

export function useDeleteBudget() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => budgetsService.delete(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financesKeys.budgets() })
    },
  })
}

// ============================================
// FINANCIAL GOALS HOOKS
// ============================================

export function useFinancialGoals() {
  const supabase = createClient()

  return useQuery({
    queryKey: financesKeys.goalsList(),
    queryFn: () => goalsService.getAll(supabase),
  })
}

export function useFinancialGoal(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: financesKeys.goalDetail(id),
    queryFn: () => goalsService.getById(supabase, id),
    enabled: !!id,
  })
}

export function useCreateGoal() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      goal: Omit<FinancialGoal, 'id' | 'createdAt' | 'contributions' | 'currentAmount'>
    ) => goalsService.create(supabase, goal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financesKeys.goals() })
    },
  })
}

export function useUpdateGoal() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string
      updates: Partial<Omit<FinancialGoal, 'id' | 'createdAt' | 'contributions'>>
    }) => goalsService.update(supabase, id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: financesKeys.goals() })
      queryClient.invalidateQueries({ queryKey: financesKeys.goalDetail(data.id) })
    },
  })
}

export function useDeleteGoal() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => goalsService.delete(supabase, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financesKeys.goals() })
    },
  })
}

export function useAddGoalContribution() {
  const supabase = createClient()
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: financesKeys.goals() })
      queryClient.invalidateQueries({ queryKey: financesKeys.goalDetail(data.goal.id) })
    },
  })
}

// ============================================
// COMPUTED HOOKS
// ============================================

export function useMonthlyBalance(month: string) {
  const { data: transactions, ...rest } = useTransactionsByMonth(month)

  const balance = transactions?.reduce(
    (acc, t) => {
      if (t.type === 'income') {
        acc.totalIncome += t.amount
      } else {
        acc.totalExpenses += t.amount
      }
      return acc
    },
    { totalIncome: 0, totalExpenses: 0 }
  )

  return {
    ...rest,
    data: balance
      ? {
          month,
          totalIncome: balance.totalIncome,
          totalExpenses: balance.totalExpenses,
          balance: balance.totalIncome - balance.totalExpenses,
          transactionCount: transactions?.length ?? 0,
        }
      : undefined,
  }
}

export function useTotalBalance() {
  const { data: transactions, ...rest } = useTransactions()

  const balance = transactions?.reduce(
    (acc, t) => {
      if (t.type === 'income') {
        return acc + t.amount
      } else {
        return acc - t.amount
      }
    },
    0
  )

  return {
    ...rest,
    data: balance ?? 0,
  }
}
