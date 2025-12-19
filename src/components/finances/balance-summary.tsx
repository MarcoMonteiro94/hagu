'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { useFinancesStore, useCurrentMonthBalance } from '@/stores/finances'
import { formatCurrency } from '@/lib/finances'
import { cn } from '@/lib/utils'
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'

export function BalanceSummary() {
  const t = useTranslations()
  const { currency, getTotalBalance } = useFinancesStore()
  const monthlyBalance = useCurrentMonthBalance()
  const totalBalance = getTotalBalance()

  const isPositive = monthlyBalance.balance >= 0

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Balance */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('finances.totalBalance')}
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(totalBalance, currency)}
              </p>
            </div>
            <div className="rounded-full bg-primary/10 p-3">
              <Wallet className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Balance */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('finances.monthlyBalance')}
              </p>
              <p
                className={cn(
                  'text-2xl font-bold',
                  isPositive ? 'text-green-500' : 'text-red-500'
                )}
              >
                {formatCurrency(monthlyBalance.balance, currency)}
              </p>
            </div>
            <div
              className={cn(
                'rounded-full p-3',
                isPositive ? 'bg-green-500/10' : 'bg-red-500/10'
              )}
            >
              {isPositive ? (
                <TrendingUp className="h-6 w-6 text-green-500" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-500" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Income */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('finances.income')}
              </p>
              <p className="text-2xl font-bold text-green-500">
                {formatCurrency(monthlyBalance.totalIncome, currency)}
              </p>
            </div>
            <div className="rounded-full bg-green-500/10 p-3">
              <ArrowUpCircle className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Expenses */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('finances.expenses')}
              </p>
              <p className="text-2xl font-bold text-red-500">
                {formatCurrency(monthlyBalance.totalExpenses, currency)}
              </p>
            </div>
            <div className="rounded-full bg-red-500/10 p-3">
              <ArrowDownCircle className="h-6 w-6 text-red-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
