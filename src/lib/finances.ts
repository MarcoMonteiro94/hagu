import type {
  Transaction,
  MonthlyBalance,
  CategorySummary,
  CurrencyCode,
  CurrencyConfig,
  CURRENCIES,
  RecurrenceFrequency,
} from '@/types/finances'

// Re-export currencies for convenience
export { CURRENCIES } from '@/types/finances'

/**
 * Format a number as currency
 */
export function formatCurrency(
  amount: number,
  currencyCode: CurrencyCode = 'BRL'
): string {
  const config = getCurrencyConfig(currencyCode)
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: config.decimalPlaces,
    maximumFractionDigits: config.decimalPlaces,
  }).format(amount)
}

/**
 * Get currency configuration
 */
export function getCurrencyConfig(code: CurrencyCode): CurrencyConfig {
  const { CURRENCIES } = require('@/types/finances')
  return CURRENCIES[code]
}

/**
 * Parse a currency string to number
 */
export function parseCurrencyInput(value: string): number {
  // Remove currency symbols and spaces
  const cleaned = value.replace(/[^\d,.-]/g, '')
  // Handle Brazilian format (1.234,56) vs US format (1,234.56)
  const normalized = cleaned.includes(',') && cleaned.includes('.')
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : cleaned.replace(',', '.')
  return parseFloat(normalized) || 0
}

/**
 * Get the current month in YYYY-MM format
 */
export function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Calculate monthly balance from transactions
 */
export function calculateMonthlyBalance(
  transactions: Transaction[],
  month: string
): MonthlyBalance {
  const monthTransactions = transactions.filter((t) =>
    t.date.startsWith(month)
  )

  const totalIncome = monthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = monthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  return {
    month,
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    transactionCount: monthTransactions.length,
  }
}

/**
 * Calculate category summaries for a given period
 */
export function calculateCategorySummaries(
  transactions: Transaction[],
  type: 'income' | 'expense'
): CategorySummary[] {
  const filtered = transactions.filter((t) => t.type === type)
  const total = filtered.reduce((sum, t) => sum + t.amount, 0)

  const byCategory = filtered.reduce(
    (acc, t) => {
      if (!acc[t.categoryId]) {
        acc[t.categoryId] = { total: 0, count: 0 }
      }
      acc[t.categoryId].total += t.amount
      acc[t.categoryId].count += 1
      return acc
    },
    {} as Record<string, { total: number; count: number }>
  )

  return Object.entries(byCategory).map(([categoryId, data]) => ({
    categoryId,
    total: data.total,
    count: data.count,
    percentage: total > 0 ? (data.total / total) * 100 : 0,
  }))
}

/**
 * Filter transactions by date range
 */
export function filterTransactionsByDateRange(
  transactions: Transaction[],
  startDate: string,
  endDate: string
): Transaction[] {
  return transactions.filter((t) => t.date >= startDate && t.date <= endDate)
}

/**
 * Filter transactions by month
 */
export function filterTransactionsByMonth(
  transactions: Transaction[],
  month: string
): Transaction[] {
  return transactions.filter((t) => t.date.startsWith(month))
}

/**
 * Calculate next recurrence date
 */
export function calculateNextRecurrenceDate(
  currentDate: string,
  frequency: RecurrenceFrequency
): string {
  const date = new Date(currentDate)

  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1)
      break
    case 'weekly':
      date.setDate(date.getDate() + 7)
      break
    case 'biweekly':
      date.setDate(date.getDate() + 14)
      break
    case 'monthly':
      date.setMonth(date.getMonth() + 1)
      break
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1)
      break
  }

  return date.toISOString().split('T')[0]
}

/**
 * Get months between two dates
 */
export function getMonthsBetween(startMonth: string, endMonth: string): string[] {
  const months: string[] = []
  const start = new Date(startMonth + '-01')
  const end = new Date(endMonth + '-01')

  while (start <= end) {
    months.push(start.toISOString().slice(0, 7))
    start.setMonth(start.getMonth() + 1)
  }

  return months
}

/**
 * Get the last N months including current
 */
export function getLastNMonths(n: number): string[] {
  const months: string[] = []
  const date = new Date()

  for (let i = 0; i < n; i++) {
    months.unshift(date.toISOString().slice(0, 7))
    date.setMonth(date.getMonth() - 1)
  }

  return months
}

/**
 * Calculate compound interest
 */
export function calculateCompoundInterest(
  principal: number,
  monthlyContribution: number,
  annualRate: number,
  years: number,
  compoundingFrequency: 'monthly' | 'quarterly' | 'yearly' = 'monthly'
): { finalAmount: number; totalContributed: number; totalInterest: number; yearlyBreakdown: Array<{ year: number; amount: number; contributed: number; interest: number }> } {
  const frequencyMap = { monthly: 12, quarterly: 4, yearly: 1 }
  const n = frequencyMap[compoundingFrequency]
  const r = annualRate / 100

  const yearlyBreakdown: Array<{
    year: number
    amount: number
    contributed: number
    interest: number
  }> = []

  let currentAmount = principal
  let totalContributed = principal

  for (let year = 1; year <= years; year++) {
    // Add monthly contributions for the year
    const yearContributions = monthlyContribution * 12
    totalContributed += yearContributions

    // Calculate compound interest for the year
    // Using formula: A = P(1 + r/n)^(nt) for principal
    // Plus future value of annuity for contributions
    const periodsPerYear = n
    const ratePerPeriod = r / n

    for (let period = 0; period < periodsPerYear; period++) {
      currentAmount = currentAmount * (1 + ratePerPeriod)
      // Add proportional monthly contributions
      currentAmount += (monthlyContribution * 12) / periodsPerYear
    }

    yearlyBreakdown.push({
      year,
      amount: currentAmount,
      contributed: totalContributed,
      interest: currentAmount - totalContributed,
    })
  }

  return {
    finalAmount: currentAmount,
    totalContributed,
    totalInterest: currentAmount - totalContributed,
    yearlyBreakdown,
  }
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Get month name from YYYY-MM string
 */
export function getMonthName(month: string, locale: string = 'pt-BR'): string {
  const date = new Date(month + '-01')
  return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' })
}

/**
 * Sort transactions by date (most recent first)
 */
export function sortTransactionsByDate(
  transactions: Transaction[],
  ascending: boolean = false
): Transaction[] {
  return [...transactions].sort((a, b) => {
    const comparison = new Date(b.date).getTime() - new Date(a.date).getTime()
    return ascending ? -comparison : comparison
  })
}
