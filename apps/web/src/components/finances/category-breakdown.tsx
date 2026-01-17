'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useSettings } from '@/hooks/queries/use-settings'
import { useTransactionsByMonth } from '@/hooks/queries/use-finances'
import { getCategoryById } from '@/config/finance-categories'
import { formatCurrency, getCurrentMonth, formatPercentage } from '@/lib/finances'
import type { TransactionType } from '@/types/finances'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'

interface CategoryBreakdownProps {
  type?: TransactionType
  month?: string
  showChart?: boolean
}

export function CategoryBreakdown({
  type = 'expense',
  month = getCurrentMonth(),
  showChart = true,
}: CategoryBreakdownProps) {
  const t = useTranslations()
  const { data: settings } = useSettings()
  const currency = settings?.currency ?? 'BRL'
  const { data: transactions = [] } = useTransactionsByMonth(month)

  // Compute category summaries from transactions
  const summaries = useMemo(() => {
    const filtered = transactions.filter((t) => t.type === type)
    const byCategory: Record<string, number> = {}
    filtered.forEach((t) => {
      byCategory[t.categoryId] = (byCategory[t.categoryId] || 0) + t.amount
    })
    const total = filtered.reduce((sum, t) => sum + t.amount, 0)
    return Object.entries(byCategory).map(([categoryId, categoryTotal]) => ({
      categoryId,
      total: categoryTotal,
      percentage: total > 0 ? (categoryTotal / total) * 100 : 0,
      count: filtered.filter((t) => t.categoryId === categoryId).length,
    }))
  }, [transactions, type])

  const chartData = useMemo(() => {
    return summaries
      .map((summary) => {
        const category = getCategoryById(summary.categoryId)
        return {
          name: category ? t(category.nameKey) : summary.categoryId,
          value: summary.total,
          percentage: summary.percentage,
          color: category?.color || '#6b7280',
        }
      })
      .sort((a, b) => b.value - a.value)
  }, [summaries, t])

  const total = summaries.reduce((sum, s) => sum + s.total, 0)

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {type === 'expense'
              ? t('finances.expensesByCategory')
              : t('finances.incomeByCategory')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            {t('finances.noDataForPeriod')}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {type === 'expense'
            ? t('finances.expensesByCategory')
            : t('finances.incomeByCategory')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pie Chart */}
        {showChart && chartData.length > 0 && (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(value as number, currency)}
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--card-foreground)',
                  }}
                  labelStyle={{ color: 'var(--card-foreground)' }}
                  itemStyle={{ color: 'var(--card-foreground)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Category List */}
        <div className="space-y-3">
          {chartData.map((item) => (
            <div key={item.name} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {formatCurrency(item.value, currency)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({formatPercentage(item.percentage)})
                  </span>
                </div>
              </div>
              <Progress
                value={item.percentage}
                className="h-1.5"
                style={
                  {
                    '--progress-background': item.color,
                  } as React.CSSProperties
                }
              />
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex items-center justify-between border-t pt-3 font-medium">
          <span>{t('finances.total')}</span>
          <span>{formatCurrency(total, currency)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
