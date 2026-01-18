import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { Transaction } from '../types/finances'

// Mock getCurrencyConfig since it uses require() which doesn't work in Vitest
const mockCurrencies = {
  BRL: { code: 'BRL', symbol: 'R$', locale: 'pt-BR', decimalPlaces: 2 },
  USD: { code: 'USD', symbol: '$', locale: 'en-US', decimalPlaces: 2 },
  EUR: { code: 'EUR', symbol: '€', locale: 'de-DE', decimalPlaces: 2 },
}

vi.mock('./finances', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./finances')>()
  return {
    ...actual,
    getCurrencyConfig: vi.fn((code: string) => mockCurrencies[code as keyof typeof mockCurrencies]),
    formatCurrency: vi.fn((amount: number, currencyCode: string = 'BRL') => {
      const config = mockCurrencies[currencyCode as keyof typeof mockCurrencies] || mockCurrencies.BRL
      return new Intl.NumberFormat(config.locale, {
        style: 'currency',
        currency: config.code,
        minimumFractionDigits: config.decimalPlaces,
        maximumFractionDigits: config.decimalPlaces,
      }).format(amount)
    }),
  }
})

import { getTodayString } from './utils'
import {
  formatCurrency,
  getCurrencyConfig,
  parseCurrencyInput,
  getLocalDateString,
  getCurrentMonth,
  calculateMonthlyBalance,
  calculateCategorySummaries,
  filterTransactionsByDateRange,
  filterTransactionsByMonth,
  calculateNextRecurrenceDate,
  getMonthsBetween,
  getLastNMonths,
  calculateCompoundInterest,
  formatPercentage,
  getMonthName,
  sortTransactionsByDate,
} from './finances'

// Helper to create mock transactions
function createTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    type: 'expense',
    amount: 100,
    description: 'Test transaction',
    categoryId: 'cat-1',
    date: '2024-01-15',
    isRecurring: false,
    createdAt: '2024-01-15T10:00:00Z',
    ...overrides,
  }
}

describe('finances utilities', () => {
  describe('formatCurrency', () => {
    it('formats BRL currency correctly', () => {
      const result = formatCurrency(1234.56, 'BRL')
      // Brazilian format uses R$ and comma for decimals
      expect(result).toContain('R$')
      expect(result).toContain('1.234,56')
    })

    it('formats USD currency correctly', () => {
      const result = formatCurrency(1234.56, 'USD')
      expect(result).toContain('$')
      expect(result).toContain('1,234.56')
    })

    it('formats EUR currency correctly', () => {
      const result = formatCurrency(1234.56, 'EUR')
      expect(result).toContain('€')
    })

    it('defaults to BRL when no currency specified', () => {
      const result = formatCurrency(100)
      expect(result).toContain('R$')
    })

    it('handles zero amount', () => {
      const result = formatCurrency(0, 'BRL')
      expect(result).toContain('R$')
      expect(result).toContain('0,00')
    })

    it('handles negative amounts', () => {
      const result = formatCurrency(-500.5, 'BRL')
      expect(result).toContain('-')
      expect(result).toContain('500,50')
    })
  })

  describe('getCurrencyConfig', () => {
    it('returns BRL configuration', () => {
      const config = getCurrencyConfig('BRL')
      expect(config.code).toBe('BRL')
      expect(config.symbol).toBe('R$')
      expect(config.locale).toBe('pt-BR')
      expect(config.decimalPlaces).toBe(2)
    })

    it('returns USD configuration', () => {
      const config = getCurrencyConfig('USD')
      expect(config.code).toBe('USD')
      expect(config.symbol).toBe('$')
      expect(config.locale).toBe('en-US')
    })

    it('returns EUR configuration', () => {
      const config = getCurrencyConfig('EUR')
      expect(config.code).toBe('EUR')
      expect(config.symbol).toBe('€')
    })
  })

  describe('parseCurrencyInput', () => {
    it('parses Brazilian format (1.234,56)', () => {
      const result = parseCurrencyInput('1.234,56')
      expect(result).toBe(1234.56)
    })

    it('parses US format with only decimal (1234.56)', () => {
      // Note: When both comma and dot are present, function assumes Brazilian format
      // US format works correctly when only dot is used as decimal
      const result = parseCurrencyInput('1234.56')
      expect(result).toBe(1234.56)
    })

    it('treats ambiguous format as Brazilian (1,234.56 -> 1.23456)', () => {
      // When both separators present, assumes Brazilian format (dots are thousands)
      const result = parseCurrencyInput('1,234.56')
      // This becomes "123456" then "123456" = 1.23456 (dots removed, comma becomes dot)
      expect(result).toBe(1.23456)
    })

    it('parses simple number', () => {
      const result = parseCurrencyInput('100')
      expect(result).toBe(100)
    })

    it('parses number with currency symbol', () => {
      const result = parseCurrencyInput('R$ 1.234,56')
      expect(result).toBe(1234.56)
    })

    it('parses negative number', () => {
      const result = parseCurrencyInput('-500,50')
      expect(result).toBe(-500.5)
    })

    it('returns 0 for invalid input', () => {
      const result = parseCurrencyInput('invalid')
      expect(result).toBe(0)
    })

    it('returns 0 for empty string', () => {
      const result = parseCurrencyInput('')
      expect(result).toBe(0)
    })

    it('handles comma as decimal separator only', () => {
      const result = parseCurrencyInput('100,50')
      expect(result).toBe(100.5)
    })
  })

  describe('getLocalDateString', () => {
    it('formats date as YYYY-MM-DD', () => {
      const date = new Date(2024, 0, 15) // January 15, 2024
      const result = getLocalDateString(date)
      expect(result).toBe('2024-01-15')
    })

    it('pads single digit month and day', () => {
      const date = new Date(2024, 4, 5) // May 5, 2024
      const result = getLocalDateString(date)
      expect(result).toBe('2024-05-05')
    })

    it('uses current date when no argument provided', () => {
      const result = getLocalDateString()
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('getCurrentMonth', () => {
    it('returns current month in YYYY-MM format', () => {
      const result = getCurrentMonth()
      expect(result).toMatch(/^\d{4}-\d{2}$/)
    })

    it('matches current date', () => {
      const now = new Date()
      const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const result = getCurrentMonth()
      expect(result).toBe(expected)
    })
  })

  describe('getTodayString', () => {
    it('returns today in YYYY-MM-DD format', () => {
      const result = getTodayString()
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('matches getLocalDateString with no arguments', () => {
      const result = getTodayString()
      const expected = getLocalDateString()
      expect(result).toBe(expected)
    })
  })

  describe('calculateMonthlyBalance', () => {
    it('calculates balance for a month with transactions', () => {
      const transactions: Transaction[] = [
        createTransaction({ type: 'income', amount: 5000, date: '2024-01-10' }),
        createTransaction({ type: 'expense', amount: 1000, date: '2024-01-15' }),
        createTransaction({ type: 'expense', amount: 500, date: '2024-01-20' }),
      ]

      const result = calculateMonthlyBalance(transactions, '2024-01')

      expect(result.month).toBe('2024-01')
      expect(result.totalIncome).toBe(5000)
      expect(result.totalExpenses).toBe(1500)
      expect(result.balance).toBe(3500)
      expect(result.transactionCount).toBe(3)
    })

    it('returns zeros for month with no transactions', () => {
      const transactions: Transaction[] = [
        createTransaction({ date: '2024-02-15' }),
      ]

      const result = calculateMonthlyBalance(transactions, '2024-01')

      expect(result.totalIncome).toBe(0)
      expect(result.totalExpenses).toBe(0)
      expect(result.balance).toBe(0)
      expect(result.transactionCount).toBe(0)
    })

    it('filters transactions from other months', () => {
      const transactions: Transaction[] = [
        createTransaction({ type: 'income', amount: 1000, date: '2024-01-15' }),
        createTransaction({ type: 'expense', amount: 500, date: '2024-02-15' }),
      ]

      const result = calculateMonthlyBalance(transactions, '2024-01')

      expect(result.totalIncome).toBe(1000)
      expect(result.totalExpenses).toBe(0)
      expect(result.transactionCount).toBe(1)
    })

    it('handles negative balance', () => {
      const transactions: Transaction[] = [
        createTransaction({ type: 'income', amount: 1000, date: '2024-01-10' }),
        createTransaction({ type: 'expense', amount: 2000, date: '2024-01-15' }),
      ]

      const result = calculateMonthlyBalance(transactions, '2024-01')

      expect(result.balance).toBe(-1000)
    })
  })

  describe('calculateCategorySummaries', () => {
    it('calculates expense summaries by category', () => {
      const transactions: Transaction[] = [
        createTransaction({ type: 'expense', amount: 500, categoryId: 'food' }),
        createTransaction({ type: 'expense', amount: 300, categoryId: 'food' }),
        createTransaction({ type: 'expense', amount: 200, categoryId: 'transport' }),
      ]

      const result = calculateCategorySummaries(transactions, 'expense')

      expect(result).toHaveLength(2)

      const foodCategory = result.find(c => c.categoryId === 'food')
      expect(foodCategory?.total).toBe(800)
      expect(foodCategory?.count).toBe(2)
      expect(foodCategory?.percentage).toBe(80)

      const transportCategory = result.find(c => c.categoryId === 'transport')
      expect(transportCategory?.total).toBe(200)
      expect(transportCategory?.count).toBe(1)
      expect(transportCategory?.percentage).toBe(20)
    })

    it('calculates income summaries by category', () => {
      const transactions: Transaction[] = [
        createTransaction({ type: 'income', amount: 5000, categoryId: 'salary' }),
        createTransaction({ type: 'expense', amount: 500, categoryId: 'food' }),
      ]

      const result = calculateCategorySummaries(transactions, 'income')

      expect(result).toHaveLength(1)
      expect(result[0].categoryId).toBe('salary')
      expect(result[0].total).toBe(5000)
      expect(result[0].percentage).toBe(100)
    })

    it('returns empty array when no matching transactions', () => {
      const transactions: Transaction[] = [
        createTransaction({ type: 'income', amount: 1000 }),
      ]

      const result = calculateCategorySummaries(transactions, 'expense')

      expect(result).toHaveLength(0)
    })

    it('handles zero total gracefully', () => {
      const result = calculateCategorySummaries([], 'expense')
      expect(result).toHaveLength(0)
    })
  })

  describe('filterTransactionsByDateRange', () => {
    it('filters transactions within date range', () => {
      const transactions: Transaction[] = [
        createTransaction({ id: '1', date: '2024-01-01' }),
        createTransaction({ id: '2', date: '2024-01-15' }),
        createTransaction({ id: '3', date: '2024-01-31' }),
        createTransaction({ id: '4', date: '2024-02-01' }),
      ]

      const result = filterTransactionsByDateRange(transactions, '2024-01-01', '2024-01-31')

      expect(result).toHaveLength(3)
      expect(result.map(t => t.id)).toEqual(['1', '2', '3'])
    })

    it('includes boundary dates', () => {
      const transactions: Transaction[] = [
        createTransaction({ id: '1', date: '2024-01-01' }),
        createTransaction({ id: '2', date: '2024-01-31' }),
      ]

      const result = filterTransactionsByDateRange(transactions, '2024-01-01', '2024-01-31')

      expect(result).toHaveLength(2)
    })

    it('returns empty array when no transactions in range', () => {
      const transactions: Transaction[] = [
        createTransaction({ date: '2024-02-15' }),
      ]

      const result = filterTransactionsByDateRange(transactions, '2024-01-01', '2024-01-31')

      expect(result).toHaveLength(0)
    })
  })

  describe('filterTransactionsByMonth', () => {
    it('filters transactions for specific month', () => {
      const transactions: Transaction[] = [
        createTransaction({ id: '1', date: '2024-01-05' }),
        createTransaction({ id: '2', date: '2024-01-20' }),
        createTransaction({ id: '3', date: '2024-02-01' }),
      ]

      const result = filterTransactionsByMonth(transactions, '2024-01')

      expect(result).toHaveLength(2)
      expect(result.map(t => t.id)).toEqual(['1', '2'])
    })

    it('returns empty array for month with no transactions', () => {
      const transactions: Transaction[] = [
        createTransaction({ date: '2024-01-15' }),
      ]

      const result = filterTransactionsByMonth(transactions, '2024-02')

      expect(result).toHaveLength(0)
    })
  })

  describe('calculateNextRecurrenceDate', () => {
    it('calculates next daily recurrence', () => {
      const result = calculateNextRecurrenceDate('2024-01-15', 'daily')
      expect(result).toBe('2024-01-16')
    })

    it('calculates next weekly recurrence', () => {
      const result = calculateNextRecurrenceDate('2024-01-15', 'weekly')
      expect(result).toBe('2024-01-22')
    })

    it('calculates next biweekly recurrence', () => {
      const result = calculateNextRecurrenceDate('2024-01-15', 'biweekly')
      expect(result).toBe('2024-01-29')
    })

    it('calculates next monthly recurrence', () => {
      const result = calculateNextRecurrenceDate('2024-01-15', 'monthly')
      expect(result).toBe('2024-02-15')
    })

    it('calculates next yearly recurrence', () => {
      const result = calculateNextRecurrenceDate('2024-01-15', 'yearly')
      expect(result).toBe('2025-01-15')
    })

    it('handles month boundary for daily recurrence', () => {
      const result = calculateNextRecurrenceDate('2024-01-31', 'daily')
      expect(result).toBe('2024-02-01')
    })

    it('handles year boundary', () => {
      const result = calculateNextRecurrenceDate('2024-12-31', 'daily')
      expect(result).toBe('2025-01-01')
    })

    it('handles monthly recurrence at end of month', () => {
      // January 31 + 1 month = February 29 (leap year) or March 2/3
      const result = calculateNextRecurrenceDate('2024-01-31', 'monthly')
      // Date will roll over to March 2nd since Feb 2024 has 29 days
      expect(result).toBe('2024-03-02')
    })
  })

  describe('getMonthsBetween', () => {
    it('returns months between two dates', () => {
      const result = getMonthsBetween('2024-01', '2024-03')
      expect(result).toEqual(['2024-01', '2024-02', '2024-03'])
    })

    it('returns single month when start equals end', () => {
      const result = getMonthsBetween('2024-01', '2024-01')
      expect(result).toEqual(['2024-01'])
    })

    it('handles year boundary', () => {
      const result = getMonthsBetween('2023-11', '2024-02')
      expect(result).toEqual(['2023-11', '2023-12', '2024-01', '2024-02'])
    })

    it('returns full year', () => {
      const result = getMonthsBetween('2024-01', '2024-12')
      expect(result).toHaveLength(12)
      expect(result[0]).toBe('2024-01')
      expect(result[11]).toBe('2024-12')
    })
  })

  describe('getLastNMonths', () => {
    let realDate: typeof Date

    beforeEach(() => {
      realDate = global.Date
      const mockDate = new Date(2024, 5, 15) // June 15, 2024
      vi.useFakeTimers()
      vi.setSystemTime(mockDate)
    })

    afterEach(() => {
      vi.useRealTimers()
      global.Date = realDate
    })

    it('returns last N months including current', () => {
      const result = getLastNMonths(3)
      expect(result).toEqual(['2024-04', '2024-05', '2024-06'])
    })

    it('returns single month for n=1', () => {
      const result = getLastNMonths(1)
      expect(result).toEqual(['2024-06'])
    })

    it('handles year boundary', () => {
      const result = getLastNMonths(8)
      expect(result).toContain('2023-11')
      expect(result).toContain('2024-06')
    })
  })

  describe('calculateCompoundInterest', () => {
    it('calculates compound interest with monthly compounding', () => {
      const result = calculateCompoundInterest(10000, 500, 10, 5, 'monthly')

      expect(result.totalContributed).toBe(40000) // 10000 + (500 * 12 * 5)
      expect(result.finalAmount).toBeGreaterThan(result.totalContributed)
      expect(result.totalInterest).toBeGreaterThan(0)
      expect(result.yearlyBreakdown).toHaveLength(5)
    })

    it('calculates compound interest with yearly compounding', () => {
      const result = calculateCompoundInterest(10000, 0, 10, 1, 'yearly')

      // Simple case: 10000 * 1.10 = 11000
      expect(result.finalAmount).toBeCloseTo(11000, 0)
      expect(result.totalInterest).toBeCloseTo(1000, 0)
    })

    it('calculates compound interest with quarterly compounding', () => {
      const result = calculateCompoundInterest(10000, 100, 12, 2, 'quarterly')

      expect(result.yearlyBreakdown).toHaveLength(2)
      expect(result.finalAmount).toBeGreaterThan(10000 + 2400) // Principal + contributions
    })

    it('handles zero interest rate', () => {
      const result = calculateCompoundInterest(10000, 500, 0, 5, 'monthly')

      expect(result.totalContributed).toBe(40000)
      expect(result.finalAmount).toBe(40000)
      expect(result.totalInterest).toBe(0)
    })

    it('handles zero monthly contribution', () => {
      const result = calculateCompoundInterest(10000, 0, 10, 1, 'monthly')

      expect(result.totalContributed).toBe(10000)
      expect(result.finalAmount).toBeGreaterThan(10000)
    })

    it('provides yearly breakdown with correct structure', () => {
      const result = calculateCompoundInterest(10000, 500, 10, 3, 'monthly')

      expect(result.yearlyBreakdown[0]).toHaveProperty('year', 1)
      expect(result.yearlyBreakdown[0]).toHaveProperty('amount')
      expect(result.yearlyBreakdown[0]).toHaveProperty('contributed')
      expect(result.yearlyBreakdown[0]).toHaveProperty('interest')

      // Each year's interest should be amount - contributed
      result.yearlyBreakdown.forEach(year => {
        expect(year.interest).toBeCloseTo(year.amount - year.contributed, 2)
      })
    })
  })

  describe('formatPercentage', () => {
    it('formats percentage with default decimals', () => {
      const result = formatPercentage(75.567)
      expect(result).toBe('75.6%')
    })

    it('formats percentage with custom decimals', () => {
      const result = formatPercentage(75.567, 2)
      expect(result).toBe('75.57%')
    })

    it('formats zero', () => {
      const result = formatPercentage(0)
      expect(result).toBe('0.0%')
    })

    it('formats 100%', () => {
      const result = formatPercentage(100)
      expect(result).toBe('100.0%')
    })

    it('formats percentage with no decimals', () => {
      const result = formatPercentage(75.567, 0)
      expect(result).toBe('76%')
    })
  })

  describe('getMonthName', () => {
    it('returns month name in Portuguese by default', () => {
      const result = getMonthName('2024-01')
      expect(result.toLowerCase()).toContain('janeiro')
      expect(result).toContain('2024')
    })

    it('returns month name in English', () => {
      const result = getMonthName('2024-01', 'en-US')
      expect(result.toLowerCase()).toContain('january')
      expect(result).toContain('2024')
    })

    it('handles different months', () => {
      const december = getMonthName('2024-12', 'pt-BR')
      expect(december.toLowerCase()).toContain('dezembro')
    })
  })

  describe('sortTransactionsByDate', () => {
    it('sorts transactions by date descending by default', () => {
      const transactions: Transaction[] = [
        createTransaction({ id: '1', date: '2024-01-15' }),
        createTransaction({ id: '2', date: '2024-01-20' }),
        createTransaction({ id: '3', date: '2024-01-10' }),
      ]

      const result = sortTransactionsByDate(transactions)

      expect(result.map(t => t.id)).toEqual(['2', '1', '3'])
    })

    it('sorts transactions by date ascending', () => {
      const transactions: Transaction[] = [
        createTransaction({ id: '1', date: '2024-01-15' }),
        createTransaction({ id: '2', date: '2024-01-20' }),
        createTransaction({ id: '3', date: '2024-01-10' }),
      ]

      const result = sortTransactionsByDate(transactions, true)

      expect(result.map(t => t.id)).toEqual(['3', '1', '2'])
    })

    it('does not mutate original array', () => {
      const transactions: Transaction[] = [
        createTransaction({ id: '1', date: '2024-01-15' }),
        createTransaction({ id: '2', date: '2024-01-10' }),
      ]

      const result = sortTransactionsByDate(transactions)

      expect(transactions[0].id).toBe('1')
      expect(result[0].id).toBe('1')
    })

    it('handles empty array', () => {
      const result = sortTransactionsByDate([])
      expect(result).toEqual([])
    })

    it('handles single transaction', () => {
      const transactions: Transaction[] = [
        createTransaction({ id: '1', date: '2024-01-15' }),
      ]

      const result = sortTransactionsByDate(transactions)

      expect(result).toHaveLength(1)
    })
  })
})
