// Finance-specific types for expense tracking and financial management

export type TransactionType = 'income' | 'expense'

export type CompoundingFrequency = 'monthly' | 'quarterly' | 'yearly'

export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly'

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  categoryId: string
  description: string
  date: string // ISO date (YYYY-MM-DD)
  paymentMethod?: string
  tags?: string[]
  isRecurring: boolean
  recurrence?: {
    frequency: RecurrenceFrequency
    nextDate?: string
    endDate?: string
  }
  createdAt: string
  updatedAt?: string
}

export interface TransactionCategory {
  id: string
  name: string
  nameKey: string // i18n key
  type: TransactionType
  icon: string
  color: string
  isCustom: boolean
  budgetLimit?: number
}

export interface Budget {
  id: string
  categoryId: string
  monthlyLimit: number
  month: string // YYYY-MM format
}

export interface FinancialGoal {
  id: string
  name: string
  description?: string
  targetAmount: number
  currentAmount: number
  deadline?: string
  color: string
  icon?: string
  contributions: GoalContribution[]
  createdAt: string
  completedAt?: string
}

export interface GoalContribution {
  id: string
  amount: number
  date: string
  note?: string
}

export interface InvestmentSimulation {
  id: string
  name: string
  initialAmount: number
  monthlyContribution: number
  annualRate: number // percentage (e.g., 12 for 12%)
  periodYears: number
  compoundingFrequency: CompoundingFrequency
  createdAt: string
}

export interface MonthlyBalance {
  month: string // YYYY-MM
  totalIncome: number
  totalExpenses: number
  balance: number
  transactionCount: number
}

export interface CategorySummary {
  categoryId: string
  total: number
  count: number
  percentage: number
}

export type CurrencyCode = 'BRL' | 'USD' | 'EUR' | 'GBP'

export interface CurrencyConfig {
  code: CurrencyCode
  symbol: string
  locale: string
  decimalPlaces: number
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  BRL: { code: 'BRL', symbol: 'R$', locale: 'pt-BR', decimalPlaces: 2 },
  USD: { code: 'USD', symbol: '$', locale: 'en-US', decimalPlaces: 2 },
  EUR: { code: 'EUR', symbol: '€', locale: 'de-DE', decimalPlaces: 2 },
  GBP: { code: 'GBP', symbol: '£', locale: 'en-GB', decimalPlaces: 2 },
}
