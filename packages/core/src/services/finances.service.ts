import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Transaction,
  TransactionCategory,
  Budget,
  FinancialGoal,
  GoalContribution,
  TransactionType,
  RecurrenceFrequency,
} from '../types/finances'
import { getTodayString } from '../lib/utils'

// Database row types
interface DbTransaction {
  id: string
  user_id: string
  category_id: string
  type: TransactionType
  amount: number
  description: string
  date: string
  payment_method: string | null
  tags: string[]
  is_recurring: boolean
  recurrence_frequency: RecurrenceFrequency | null
  recurrence_next_date: string | null
  recurrence_end_date: string | null
  created_at: string
  updated_at: string | null
}

interface DbTransactionCategory {
  id: string
  user_id: string
  name: string
  name_key: string
  type: TransactionType
  icon: string
  color: string
  is_custom: boolean
  created_at: string
}

interface DbBudget {
  id: string
  user_id: string
  category_id: string
  monthly_limit: number
  month: string
}

interface DbFinancialGoal {
  id: string
  user_id: string
  name: string
  description: string | null
  target_amount: number
  current_amount: number
  deadline: string | null
  color: string
  icon: string | null
  created_at: string
  completed_at: string | null
}

interface DbGoalContribution {
  id: string
  goal_id: string
  user_id: string
  amount: number
  date: string
  note: string | null
  created_at: string
}

// Transform functions
function toTransaction(row: DbTransaction): Transaction {
  return {
    id: row.id,
    type: row.type,
    amount: Number(row.amount),
    categoryId: row.category_id,
    description: row.description,
    date: row.date,
    paymentMethod: row.payment_method ?? undefined,
    tags: row.tags ?? [],
    isRecurring: row.is_recurring,
    recurrence: row.recurrence_frequency
      ? {
          frequency: row.recurrence_frequency,
          nextDate: row.recurrence_next_date ?? undefined,
          endDate: row.recurrence_end_date ?? undefined,
        }
      : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
  }
}

function toCategory(row: DbTransactionCategory): TransactionCategory {
  return {
    id: row.id,
    name: row.name,
    nameKey: row.name_key,
    type: row.type,
    icon: row.icon,
    color: row.color,
    isCustom: row.is_custom,
  }
}

function toBudget(row: DbBudget): Budget {
  return {
    id: row.id,
    categoryId: row.category_id,
    monthlyLimit: Number(row.monthly_limit),
    month: row.month,
  }
}

function toGoal(row: DbFinancialGoal, contributions: GoalContribution[] = []): FinancialGoal {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    targetAmount: Number(row.target_amount),
    currentAmount: Number(row.current_amount),
    deadline: row.deadline ?? undefined,
    color: row.color,
    icon: row.icon ?? undefined,
    contributions,
    createdAt: row.created_at,
    completedAt: row.completed_at ?? undefined,
  }
}

function toContribution(row: DbGoalContribution): GoalContribution {
  return {
    id: row.id,
    amount: Number(row.amount),
    date: row.date,
    note: row.note ?? undefined,
  }
}

// ============================================
// TRANSACTIONS SERVICE
// ============================================
export const transactionsService = {
  async getAll(supabase: SupabaseClient): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })

    if (error) throw error
    return (data ?? []).map(toTransaction)
  },

  async getByMonth(supabase: SupabaseClient, month: string): Promise<Transaction[]> {
    const startDate = `${month}-01`
    const [year, monthNum] = month.split('-').map(Number)
    const lastDay = new Date(year, monthNum, 0).getDate()
    const endDate = `${month}-${lastDay.toString().padStart(2, '0')}`

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })

    if (error) throw error
    return (data ?? []).map(toTransaction)
  },

  async getById(supabase: SupabaseClient, id: string): Promise<Transaction | null> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return toTransaction(data)
  },

  async create(
    supabase: SupabaseClient,
    transaction: Omit<Transaction, 'id' | 'createdAt'>
  ): Promise<Transaction> {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userData.user.id,
        category_id: transaction.categoryId,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        date: transaction.date,
        payment_method: transaction.paymentMethod ?? null,
        tags: transaction.tags ?? [],
        is_recurring: transaction.isRecurring,
        recurrence_frequency: transaction.recurrence?.frequency ?? null,
        recurrence_next_date: transaction.recurrence?.nextDate ?? null,
        recurrence_end_date: transaction.recurrence?.endDate ?? null,
      })
      .select()
      .single()

    if (error) throw error
    return toTransaction(data)
  },

  async update(
    supabase: SupabaseClient,
    id: string,
    updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>
  ): Promise<Transaction> {
    const updateData: Record<string, unknown> = {}

    if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId
    if (updates.type !== undefined) updateData.type = updates.type
    if (updates.amount !== undefined) updateData.amount = updates.amount
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.date !== undefined) updateData.date = updates.date
    if (updates.paymentMethod !== undefined) updateData.payment_method = updates.paymentMethod ?? null
    if (updates.tags !== undefined) updateData.tags = updates.tags
    if (updates.isRecurring !== undefined) updateData.is_recurring = updates.isRecurring
    if (updates.recurrence !== undefined) {
      updateData.recurrence_frequency = updates.recurrence?.frequency ?? null
      updateData.recurrence_next_date = updates.recurrence?.nextDate ?? null
      updateData.recurrence_end_date = updates.recurrence?.endDate ?? null
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return toTransaction(data)
  },

  async delete(supabase: SupabaseClient, id: string): Promise<void> {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}

// ============================================
// CUSTOM CATEGORIES SERVICE
// ============================================
export const categoriesService = {
  async getAll(supabase: SupabaseClient): Promise<TransactionCategory[]> {
    const { data, error } = await supabase
      .from('transaction_categories')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data ?? []).map(toCategory)
  },

  async create(
    supabase: SupabaseClient,
    category: Omit<TransactionCategory, 'id' | 'isCustom'>
  ): Promise<TransactionCategory> {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('transaction_categories')
      .insert({
        user_id: userData.user.id,
        name: category.name,
        name_key: category.nameKey,
        type: category.type,
        icon: category.icon,
        color: category.color,
        is_custom: true,
      })
      .select()
      .single()

    if (error) throw error
    return toCategory(data)
  },

  async delete(supabase: SupabaseClient, id: string): Promise<void> {
    const { error } = await supabase
      .from('transaction_categories')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}

// ============================================
// BUDGETS SERVICE
// ============================================
export const budgetsService = {
  async getAll(supabase: SupabaseClient): Promise<Budget[]> {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .order('month', { ascending: false })

    if (error) throw error
    return (data ?? []).map(toBudget)
  },

  async getByMonth(supabase: SupabaseClient, month: string): Promise<Budget[]> {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('month', month)

    if (error) throw error
    return (data ?? []).map(toBudget)
  },

  async upsert(
    supabase: SupabaseClient,
    categoryId: string,
    monthlyLimit: number,
    month: string
  ): Promise<Budget> {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('budgets')
      .upsert(
        {
          user_id: userData.user.id,
          category_id: categoryId,
          monthly_limit: monthlyLimit,
          month,
        },
        { onConflict: 'user_id,category_id,month' }
      )
      .select()
      .single()

    if (error) throw error
    return toBudget(data)
  },

  async delete(supabase: SupabaseClient, id: string): Promise<void> {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}

// ============================================
// FINANCIAL GOALS SERVICE
// ============================================
export const goalsService = {
  async getAll(supabase: SupabaseClient): Promise<FinancialGoal[]> {
    const { data: goalsData, error: goalsError } = await supabase
      .from('financial_goals')
      .select('*')
      .order('created_at', { ascending: false })

    if (goalsError) throw goalsError

    if (!goalsData || goalsData.length === 0) return []

    // Get all contributions for these goals
    const goalIds = goalsData.map((g) => g.id)
    const { data: contributionsData, error: contributionsError } = await supabase
      .from('goal_contributions')
      .select('*')
      .in('goal_id', goalIds)
      .order('date', { ascending: false })

    if (contributionsError) throw contributionsError

    // Group contributions by goal
    const contributionsByGoal = (contributionsData ?? []).reduce(
      (acc, row) => {
        const contribution = toContribution(row)
        if (!acc[row.goal_id]) acc[row.goal_id] = []
        acc[row.goal_id].push(contribution)
        return acc
      },
      {} as Record<string, GoalContribution[]>
    )

    return goalsData.map((row) => toGoal(row, contributionsByGoal[row.id] ?? []))
  },

  async getById(supabase: SupabaseClient, id: string): Promise<FinancialGoal | null> {
    const { data: goalData, error: goalError } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('id', id)
      .single()

    if (goalError) {
      if (goalError.code === 'PGRST116') return null
      throw goalError
    }

    const { data: contributionsData, error: contributionsError } = await supabase
      .from('goal_contributions')
      .select('*')
      .eq('goal_id', id)
      .order('date', { ascending: false })

    if (contributionsError) throw contributionsError

    const contributions = (contributionsData ?? []).map(toContribution)
    return toGoal(goalData, contributions)
  },

  async create(
    supabase: SupabaseClient,
    goal: Omit<FinancialGoal, 'id' | 'createdAt' | 'contributions' | 'currentAmount'>
  ): Promise<FinancialGoal> {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('financial_goals')
      .insert({
        user_id: userData.user.id,
        name: goal.name,
        description: goal.description ?? null,
        target_amount: goal.targetAmount,
        current_amount: 0,
        deadline: goal.deadline ?? null,
        color: goal.color,
        icon: goal.icon ?? null,
      })
      .select()
      .single()

    if (error) throw error
    return toGoal(data, [])
  },

  async update(
    supabase: SupabaseClient,
    id: string,
    updates: Partial<Omit<FinancialGoal, 'id' | 'createdAt' | 'contributions'>>
  ): Promise<FinancialGoal> {
    const updateData: Record<string, unknown> = {}

    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.description !== undefined) updateData.description = updates.description ?? null
    if (updates.targetAmount !== undefined) updateData.target_amount = updates.targetAmount
    if (updates.currentAmount !== undefined) updateData.current_amount = updates.currentAmount
    if (updates.deadline !== undefined) updateData.deadline = updates.deadline ?? null
    if (updates.color !== undefined) updateData.color = updates.color
    if (updates.icon !== undefined) updateData.icon = updates.icon ?? null
    if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt ?? null

    const { data, error } = await supabase
      .from('financial_goals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Fetch contributions
    const { data: contributionsData } = await supabase
      .from('goal_contributions')
      .select('*')
      .eq('goal_id', id)
      .order('date', { ascending: false })

    const contributions = (contributionsData ?? []).map(toContribution)
    return toGoal(data, contributions)
  },

  async delete(supabase: SupabaseClient, id: string): Promise<void> {
    const { error } = await supabase
      .from('financial_goals')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async addContribution(
    supabase: SupabaseClient,
    goalId: string,
    amount: number,
    note?: string
  ): Promise<{ contribution: GoalContribution; goal: FinancialGoal }> {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) throw new Error('User not authenticated')

    // Get current goal
    const { data: goalData, error: goalError } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('id', goalId)
      .single()

    if (goalError) throw goalError

    const newCurrentAmount = Number(goalData.current_amount) + amount
    const isCompleted = newCurrentAmount >= Number(goalData.target_amount)

    // Create contribution
    const today = getTodayString()
    const { data: contributionData, error: contributionError } = await supabase
      .from('goal_contributions')
      .insert({
        goal_id: goalId,
        user_id: userData.user.id,
        amount,
        date: today,
        note: note ?? null,
      })
      .select()
      .single()

    if (contributionError) throw contributionError

    // Update goal current amount
    const { data: updatedGoalData, error: updateError } = await supabase
      .from('financial_goals')
      .update({
        current_amount: newCurrentAmount,
        completed_at: isCompleted && !goalData.completed_at ? new Date().toISOString() : goalData.completed_at,
      })
      .eq('id', goalId)
      .select()
      .single()

    if (updateError) throw updateError

    // Fetch all contributions
    const { data: contributionsData } = await supabase
      .from('goal_contributions')
      .select('*')
      .eq('goal_id', goalId)
      .order('date', { ascending: false })

    const contributions = (contributionsData ?? []).map(toContribution)

    return {
      contribution: toContribution(contributionData),
      goal: toGoal(updatedGoalData, contributions),
    }
  },
}
