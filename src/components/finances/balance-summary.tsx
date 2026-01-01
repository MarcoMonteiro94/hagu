'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSettings } from '@/hooks/queries/use-settings'
import { useSettingsStore } from '@/stores/settings'
import { useMonthlyBalance, useTotalBalance } from '@/hooks/queries/use-finances'
import { formatCurrency, getCurrentMonth } from '@/lib/finances'
import { cn } from '@/lib/utils'
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
} from 'lucide-react'

const HIDDEN_VALUE = '••••••'

interface BalanceSummaryProps {
  month?: string
}

export function BalanceSummary({ month }: BalanceSummaryProps) {
  const t = useTranslations()
  const { data: settings } = useSettings()
  const currency = settings?.currency ?? 'BRL'
  const hideBalances = useSettingsStore((state) => state.hideBalances) ?? false
  const toggleHideBalances = useSettingsStore((state) => state.toggleHideBalances)

  const selectedMonth = month ?? getCurrentMonth()
  const { data: monthlyBalance } = useMonthlyBalance(selectedMonth)
  const { data: totalBalance = 0 } = useTotalBalance()

  const isPositive = (monthlyBalance?.balance ?? 0) >= 0

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Balance */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  {t('finances.totalBalance')}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={toggleHideBalances}
                >
                  {hideBalances ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
              <p className="text-2xl font-bold">
                {hideBalances ? HIDDEN_VALUE : formatCurrency(totalBalance, currency)}
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
                  hideBalances ? 'text-muted-foreground' : isPositive ? 'text-green-500' : 'text-red-500'
                )}
              >
                {hideBalances ? HIDDEN_VALUE : formatCurrency(monthlyBalance?.balance ?? 0, currency)}
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
              <p className={cn('text-2xl font-bold', hideBalances ? 'text-muted-foreground' : 'text-green-500')}>
                {hideBalances ? HIDDEN_VALUE : formatCurrency(monthlyBalance?.totalIncome ?? 0, currency)}
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
              <p className={cn('text-2xl font-bold', hideBalances ? 'text-muted-foreground' : 'text-red-500')}>
                {hideBalances ? HIDDEN_VALUE : formatCurrency(monthlyBalance?.totalExpenses ?? 0, currency)}
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
