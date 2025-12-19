'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useFinancesStore } from '@/stores/finances'
import {
  formatCurrency,
  getLastNMonths,
  calculateMonthlyBalance,
} from '@/lib/finances'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface MonthlyChartProps {
  months?: number
}

export function MonthlyChart({ months = 6 }: MonthlyChartProps) {
  const t = useTranslations()
  const { transactions, currency } = useFinancesStore()

  const chartData = useMemo(() => {
    const lastMonths = getLastNMonths(months)

    return lastMonths.map((month) => {
      const balance = calculateMonthlyBalance(transactions, month)
      const [year, monthNum] = month.split('-')
      const date = new Date(parseInt(year), parseInt(monthNum) - 1)
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' })

      return {
        month: monthName,
        fullMonth: month,
        income: balance.totalIncome,
        expenses: balance.totalExpenses,
        balance: balance.balance,
      }
    })
  }, [transactions, months])

  const hasData = chartData.some((d) => d.income > 0 || d.expenses > 0)

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('finances.monthlyOverview')}</CardTitle>
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
        <CardTitle className="text-base">{t('finances.monthlyOverview')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => {
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`
                  return value.toString()
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value, name) => [
                  formatCurrency(value as number, currency),
                  name === 'income'
                    ? t('finances.income')
                    : t('finances.expenses'),
                ]}
                labelFormatter={(label) => label}
              />
              <Legend
                formatter={(value) =>
                  value === 'income'
                    ? t('finances.income')
                    : t('finances.expenses')
                }
              />
              <Bar
                dataKey="income"
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="expenses"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
