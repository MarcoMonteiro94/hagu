import { useMemo } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Transaction,
  TransactionCategory,
  Budget,
  FinancialGoal,
  GoalContribution,
  MonthlyBalance,
  CategorySummary,
  CurrencyCode,
} from '@/types/finances'
import {
  calculateMonthlyBalance,
  calculateCategorySummaries,
  filterTransactionsByMonth,
  calculateNextRecurrenceDate,
  getCurrentMonth,
  getTodayString,
} from '@/lib/finances'
import { ALL_CATEGORIES } from '@/config/finance-categories'
import { useGamificationStore } from './gamification'

interface FinancesState {
  // Data
  transactions: Transaction[]
  customCategories: TransactionCategory[]
  budgets: Budget[]
  goals: FinancialGoal[]
  currency: CurrencyCode

  // Transaction actions
  addTransaction: (
    transaction: Omit<Transaction, 'id' | 'createdAt'>
  ) => Transaction
  updateTransaction: (id: string, updates: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void
  processRecurringTransactions: () => void

  // Category actions
  addCustomCategory: (
    category: Omit<TransactionCategory, 'id' | 'isCustom'>
  ) => void
  deleteCustomCategory: (id: string) => void

  // Budget actions
  setBudget: (categoryId: string, monthlyLimit: number, month?: string) => void
  deleteBudget: (id: string) => void
  getBudgetForCategory: (categoryId: string, month?: string) => Budget | undefined

  // Goal actions
  addGoal: (goal: Omit<FinancialGoal, 'id' | 'createdAt' | 'contributions' | 'currentAmount'>) => void
  updateGoal: (id: string, updates: Partial<FinancialGoal>) => void
  deleteGoal: (id: string) => void
  addGoalContribution: (goalId: string, amount: number, note?: string) => void

  // Settings
  setCurrency: (currency: CurrencyCode) => void

  // Queries
  getTransactionsByMonth: (month: string) => Transaction[]
  getMonthlyBalance: (month: string) => MonthlyBalance
  getCategorySummaries: (
    month: string,
    type: 'income' | 'expense'
  ) => CategorySummary[]
  getAllCategories: () => TransactionCategory[]
  getTotalBalance: () => number
}

function generateId(): string {
  return crypto.randomUUID()
}

export const useFinancesStore = create<FinancesState>()(
  persist(
    (set, get) => ({
      transactions: [],
      customCategories: [],
      budgets: [],
      goals: [],
      currency: 'BRL',

      addTransaction: (transactionData) => {
        const transaction: Transaction = {
          ...transactionData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        }

        set((state) => ({
          transactions: [...state.transactions, transaction],
        }))

        // If it's a recurring transaction, set up the next occurrence
        if (transaction.isRecurring && transaction.recurrence) {
          const nextDate = calculateNextRecurrenceDate(
            transaction.date,
            transaction.recurrence.frequency
          )
          set((state) => ({
            transactions: state.transactions.map((t) =>
              t.id === transaction.id
                ? {
                    ...t,
                    recurrence: { ...t.recurrence!, nextDate },
                  }
                : t
            ),
          }))
        }

        return transaction
      },

      updateTransaction: (id, updates) => {
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id
              ? { ...t, ...updates, updatedAt: new Date().toISOString() }
              : t
          ),
        }))
      },

      deleteTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        }))
      },

      processRecurringTransactions: () => {
        const today = getTodayString()
        const { transactions, addTransaction } = get()

        transactions
          .filter(
            (t) =>
              t.isRecurring &&
              t.recurrence?.nextDate &&
              t.recurrence.nextDate <= today &&
              (!t.recurrence.endDate || t.recurrence.endDate >= today)
          )
          .forEach((t) => {
            // Create new transaction for the recurring date
            addTransaction({
              type: t.type,
              amount: t.amount,
              categoryId: t.categoryId,
              description: t.description,
              date: t.recurrence!.nextDate!,
              paymentMethod: t.paymentMethod,
              tags: t.tags,
              isRecurring: false, // The generated one is not recurring
            })

            // Update the original recurring transaction with next date
            const nextDate = calculateNextRecurrenceDate(
              t.recurrence!.nextDate!,
              t.recurrence!.frequency
            )
            set((state) => ({
              transactions: state.transactions.map((tr) =>
                tr.id === t.id
                  ? { ...tr, recurrence: { ...tr.recurrence!, nextDate } }
                  : tr
              ),
            }))
          })
      },

      addCustomCategory: (categoryData) => {
        const category: TransactionCategory = {
          ...categoryData,
          id: generateId(),
          isCustom: true,
        }

        set((state) => ({
          customCategories: [...state.customCategories, category],
        }))
      },

      deleteCustomCategory: (id) => {
        set((state) => ({
          customCategories: state.customCategories.filter((c) => c.id !== id),
        }))
      },

      setBudget: (categoryId, monthlyLimit, month = getCurrentMonth()) => {
        set((state) => {
          const existingIndex = state.budgets.findIndex(
            (b) => b.categoryId === categoryId && b.month === month
          )

          if (existingIndex >= 0) {
            // Update existing budget
            const newBudgets = [...state.budgets]
            newBudgets[existingIndex] = {
              ...newBudgets[existingIndex],
              monthlyLimit,
            }
            return { budgets: newBudgets }
          }

          // Create new budget
          return {
            budgets: [
              ...state.budgets,
              { id: generateId(), categoryId, monthlyLimit, month },
            ],
          }
        })
      },

      deleteBudget: (id) => {
        set((state) => ({
          budgets: state.budgets.filter((b) => b.id !== id),
        }))
      },

      getBudgetForCategory: (categoryId, month = getCurrentMonth()) => {
        return get().budgets.find(
          (b) => b.categoryId === categoryId && b.month === month
        )
      },

      addGoal: (goalData) => {
        const goal: FinancialGoal = {
          ...goalData,
          id: generateId(),
          currentAmount: 0,
          contributions: [],
          createdAt: new Date().toISOString(),
        }

        set((state) => ({
          goals: [...state.goals, goal],
        }))
      },

      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        }))
      },

      deleteGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        }))
      },

      addGoalContribution: (goalId, amount, note) => {
        const contribution: GoalContribution = {
          id: generateId(),
          amount,
          date: getTodayString(),
          note,
        }

        set((state) => {
          const goal = state.goals.find((g) => g.id === goalId)
          if (!goal) return state

          const newCurrentAmount = goal.currentAmount + amount
          const isCompleted = newCurrentAmount >= goal.targetAmount

          // Award XP when goal is completed (50 XP)
          if (isCompleted && !goal.completedAt) {
            useGamificationStore.getState().addXp(50)
          }

          return {
            goals: state.goals.map((g) =>
              g.id === goalId
                ? {
                    ...g,
                    currentAmount: newCurrentAmount,
                    contributions: [...g.contributions, contribution],
                    completedAt: isCompleted && !g.completedAt
                      ? new Date().toISOString()
                      : g.completedAt,
                  }
                : g
            ),
          }
        })
      },

      setCurrency: (currency) => {
        set({ currency })
      },

      getTransactionsByMonth: (month) => {
        return filterTransactionsByMonth(get().transactions, month)
      },

      getMonthlyBalance: (month) => {
        return calculateMonthlyBalance(get().transactions, month)
      },

      getCategorySummaries: (month, type) => {
        const monthTransactions = filterTransactionsByMonth(
          get().transactions,
          month
        )
        return calculateCategorySummaries(monthTransactions, type)
      },

      getAllCategories: () => {
        return [...ALL_CATEGORIES, ...get().customCategories]
      },

      getTotalBalance: () => {
        const { transactions } = get()
        const income = transactions
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0)
        const expenses = transactions
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0)
        return income - expenses
      },
    }),
    {
      name: 'hagu-finances',
    }
  )
)

// Selector hooks - use useMemo to cache computed values
export function useCurrentMonthBalance(): MonthlyBalance {
  const transactions = useFinancesStore((state) => state.transactions)
  const currentMonth = getCurrentMonth()

  // useMemo to avoid recalculating on every render
  return useMemo(
    () => calculateMonthlyBalance(transactions, currentMonth),
    [transactions, currentMonth]
  )
}

export function useRecentTransactions(limit: number = 10): Transaction[] {
  const transactions = useFinancesStore((state) => state.transactions)

  // useMemo to avoid sorting on every render
  return useMemo(
    () =>
      [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit),
    [transactions, limit]
  )
}
