'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageTransition } from '@/components/ui/motion'
import {
  TransactionForm,
  TransactionList,
  BalanceSummary,
  CategoryBreakdown,
  MonthlyChart,
  GoalsSection,
  InvestmentCalculator,
} from '@/components/finances'
import { useSettings, useUpdateSettings } from '@/hooks/queries/use-settings'
import { useSyncPaymentReminders } from '@/hooks/queries/use-finances'
import { useSettingsStore } from '@/stores/settings'
import { getCurrentMonth, getLastNMonths, getMonthName } from '@/lib/finances'
import type { CurrencyCode } from '@/types/finances'
import { CURRENCIES } from '@/types/finances'
import { toast } from 'sonner'
import {
  Plus,
  Wallet,
  Receipt,
  Target,
  Calculator,
  ArrowUpCircle,
  ArrowDownCircle,
  Bell,
  Eye,
  EyeOff,
} from 'lucide-react'

export default function FinancesPage() {
  const t = useTranslations()
  const [mounted, setMounted] = useState(false)
  const { data: settings } = useSettings()
  const updateSettingsMutation = useUpdateSettings()
  const syncPaymentRemindersMutation = useSyncPaymentReminders()
  const hideBalances = useSettingsStore((state) => state.hideBalances) ?? false
  const toggleHideBalances = useSettingsStore((state) => state.toggleHideBalances)
  const currency = settings?.currency ?? 'BRL'
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [activeTab, setActiveTab] = useState('transactions')

  const handleSyncPaymentReminders = () => {
    syncPaymentRemindersMutation.mutate(undefined, {
      onSuccess: (result) => {
        if (result.created > 0) {
          toast.success(t('finances.paymentReminders.synced', { count: result.created }))
        } else {
          toast.info(t('finances.paymentReminders.upToDate'))
        }
      },
      onError: () => {
        toast.error(t('finances.paymentReminders.error'))
      },
    })
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  const months = getLastNMonths(12)

  if (!mounted) {
    return (
      <div className="container mx-auto max-w-6xl p-4 lg:p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <PageTransition className="container mx-auto max-w-6xl space-y-6 p-4 lg:p-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
            <Wallet className="h-5 w-5 text-yellow-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('finances.title')}</h1>
            <p className="text-muted-foreground">{t('finances.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Hide Balances Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleHideBalances}
            title={hideBalances ? t('finances.showBalances') : t('finances.hideBalances')}
          >
            {hideBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>

          {/* Sync Payment Reminders Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleSyncPaymentReminders}
            disabled={syncPaymentRemindersMutation.isPending}
            title={t('finances.paymentReminders.sync')}
          >
            <Bell className={`h-4 w-4 ${syncPaymentRemindersMutation.isPending ? 'animate-pulse' : ''}`} />
          </Button>

          {/* Currency Selector */}
          <Select
            value={currency}
            onValueChange={(v) =>
              updateSettingsMutation.mutate({ currency: v as CurrencyCode })
            }
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(CURRENCIES).map((curr) => (
                <SelectItem key={curr.code} value={curr.code}>
                  {curr.symbol} {curr.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Add Transaction Button */}
          {activeTab === 'transactions' && (
            <TransactionForm
              trigger={
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('finances.addTransaction')}
                </Button>
              }
            />
          )}
        </div>
      </header>

      {/* Balance Summary Cards */}
      <BalanceSummary month={selectedMonth} />

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions" className="gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">{t('finances.tabs.transactions')}</span>
          </TabsTrigger>
          <TabsTrigger value="goals" className="gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">{t('finances.tabs.goals')}</span>
          </TabsTrigger>
          <TabsTrigger value="calculator" className="gap-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">{t('finances.tabs.calculator')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Transactions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Month Selector */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{t('finances.transactions')}</h2>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month} value={month}>
                        {getMonthName(month)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Transaction List */}
              <TransactionList month={selectedMonth} showFilters />
            </div>

            {/* Right Column - Charts & Categories */}
            <div className="space-y-6">
              {/* Monthly Chart */}
              <MonthlyChart months={6} />

              {/* Category Breakdown */}
              <Tabs defaultValue="expense">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="expense">{t('finances.expenses')}</TabsTrigger>
                  <TabsTrigger value="income">{t('finances.income')}</TabsTrigger>
                </TabsList>
                <TabsContent value="expense" className="mt-4">
                  <CategoryBreakdown type="expense" month={selectedMonth} />
                </TabsContent>
                <TabsContent value="income" className="mt-4">
                  <CategoryBreakdown type="income" month={selectedMonth} />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <GoalsSection />
            <div className="space-y-6">
              <MonthlyChart months={6} />
            </div>
          </div>
        </TabsContent>

        {/* Calculator Tab */}
        <TabsContent value="calculator" className="mt-6">
          <InvestmentCalculator />
        </TabsContent>
      </Tabs>

      {/* Quick Add Buttons (Mobile) - Only show on transactions tab */}
      {activeTab === 'transactions' && (
        <div className="fixed bottom-20 right-4 flex flex-col gap-2 lg:hidden">
          <TransactionForm
            defaultType="expense"
            trigger={
              <Button
                size="icon"
                className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 shadow-lg"
              >
                <ArrowDownCircle className="h-6 w-6" />
              </Button>
            }
          />
          <TransactionForm
            defaultType="income"
            trigger={
              <Button
                size="icon"
                className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 shadow-lg"
              >
                <ArrowUpCircle className="h-6 w-6" />
              </Button>
            }
          />
        </div>
      )}
    </PageTransition>
  )
}
