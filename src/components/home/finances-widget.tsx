'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useMonthlyBalance, useTotalBalance } from '@/hooks/queries/use-finances'
import { useSettingsStore } from '@/stores/settings'
import { formatCurrency, getCurrentMonth } from '@/lib/finances'
import { Wallet, TrendingUp, TrendingDown, ChevronRight, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

const HIDDEN_VALUE = '••••••'

export function FinancesWidget() {
  const t = useTranslations('home')
  const tFinances = useTranslations('finances')
  const currency = useSettingsStore((state) => state.currency) ?? 'BRL'
  const hideBalances = useSettingsStore((state) => state.hideBalances) ?? false
  const toggleHideBalances = useSettingsStore((state) => state.toggleHideBalances)

  const currentMonth = getCurrentMonth()
  const { data: monthlyBalance, isLoading: isLoadingMonthly } = useMonthlyBalance(currentMonth)
  const { data: totalBalance, isLoading: isLoadingTotal } = useTotalBalance()

  const isLoading = isLoadingMonthly || isLoadingTotal

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{tFinances('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-12 animate-pulse rounded-lg bg-muted" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-16 animate-pulse rounded-lg bg-muted" />
              <div className="h-16 animate-pulse rounded-lg bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const balance = totalBalance ?? 0
  const income = monthlyBalance?.totalIncome ?? 0
  const expenses = monthlyBalance?.totalExpenses ?? 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{tFinances('title')}</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleHideBalances}
            >
              {hideBalances ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Link href="/areas/finances">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Wallet className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Total Balance */}
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">{t('totalBalance')}</p>
          <p className={cn(
            'text-xl font-bold',
            hideBalances ? 'text-muted-foreground' : balance >= 0 ? 'text-green-500' : 'text-red-500'
          )}>
            {hideBalances ? HIDDEN_VALUE : formatCurrency(balance, currency)}
          </p>
        </div>

        {/* Monthly Income/Expenses */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500" />
              {t('monthlyIncome')}
            </div>
            <p className={cn('text-sm font-medium', hideBalances ? 'text-muted-foreground' : 'text-green-500')}>
              {hideBalances ? HIDDEN_VALUE : formatCurrency(income, currency)}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 text-red-500" />
              {t('monthlyExpenses')}
            </div>
            <p className={cn('text-sm font-medium', hideBalances ? 'text-muted-foreground' : 'text-red-500')}>
              {hideBalances ? HIDDEN_VALUE : formatCurrency(expenses, currency)}
            </p>
          </div>
        </div>

        <Link href="/areas/finances">
          <Button variant="ghost" className="w-full" size="sm">
            {t('viewDetails')}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
