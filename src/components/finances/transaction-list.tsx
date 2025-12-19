'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TransactionCard } from './transaction-card'
import { useFinancesStore } from '@/stores/finances'
import { sortTransactionsByDate, filterTransactionsByMonth } from '@/lib/finances'
import type { Transaction, TransactionType } from '@/types/finances'
import { getCategoriesByType, ALL_CATEGORIES } from '@/config/finance-categories'
import { ListFilter, Calendar } from 'lucide-react'

interface TransactionListProps {
  month?: string // YYYY-MM format
  limit?: number
  showFilters?: boolean
}

type FilterType = 'all' | TransactionType

export function TransactionList({
  month,
  limit,
  showFilters = true,
}: TransactionListProps) {
  const t = useTranslations()
  const { transactions } = useFinancesStore()

  const [filterType, setFilterType] = useState<FilterType>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const filteredTransactions = useMemo(() => {
    let result = transactions

    // Filter by month if provided
    if (month) {
      result = filterTransactionsByMonth(result, month)
    }

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter((t) => t.type === filterType)
    }

    // Filter by category
    if (filterCategory !== 'all') {
      result = result.filter((t) => t.categoryId === filterCategory)
    }

    // Sort by date (most recent first)
    result = sortTransactionsByDate(result)

    // Apply limit if provided
    if (limit) {
      result = result.slice(0, limit)
    }

    return result
  }, [transactions, month, filterType, filterCategory, limit])

  // Get categories for filter based on selected type
  const availableCategories = useMemo(() => {
    if (filterType === 'all') return ALL_CATEGORIES
    return getCategoriesByType(filterType)
  }, [filterType])

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {}

    filteredTransactions.forEach((t) => {
      if (!groups[t.date]) {
        groups[t.date] = []
      }
      groups[t.date].push(t)
    })

    return Object.entries(groups).sort(
      ([a], [b]) => new Date(b).getTime() - new Date(a).getTime()
    )
  }, [filteredTransactions])

  function formatDateHeader(dateStr: string): string {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (dateStr === today.toISOString().split('T')[0]) {
      return t('common.today')
    }
    if (dateStr === yesterday.toISOString().split('T')[0]) {
      return t('common.yesterday')
    }

    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Type Filter */}
          <Tabs
            value={filterType}
            onValueChange={(v) => {
              setFilterType(v as FilterType)
              setFilterCategory('all') // Reset category when type changes
            }}
          >
            <TabsList>
              <TabsTrigger value="all">{t('finances.filters.all')}</TabsTrigger>
              <TabsTrigger value="expense">
                {t('finances.filters.expenses')}
              </TabsTrigger>
              <TabsTrigger value="income">
                {t('finances.filters.income')}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Category Filter */}
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <ListFilter className="mr-2 h-4 w-4" />
              <SelectValue placeholder={t('finances.category')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('finances.filters.allCategories')}</SelectItem>
              {availableCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    {t(cat.nameKey)}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Transaction Groups */}
      {groupedTransactions.length === 0 ? (
        <div className="py-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-muted-foreground">
            {t('finances.noTransactions')}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedTransactions.map(([date, dayTransactions]) => (
            <div key={date} className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground capitalize">
                {formatDateHeader(date)}
              </h3>
              <div className="space-y-2">
                {dayTransactions.map((transaction) => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
