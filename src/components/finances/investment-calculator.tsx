'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSettings } from '@/hooks/queries/use-settings'
import { formatCurrency, calculateCompoundInterest } from '@/lib/finances'
import type { CompoundingFrequency } from '@/types/finances'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  Legend,
} from 'recharts'
import { Calculator, TrendingUp, PiggyBank, Percent } from 'lucide-react'

export function InvestmentCalculator() {
  const t = useTranslations()
  const { data: settings } = useSettings()
  const currency = settings?.currency ?? 'BRL'

  const [initialAmount, setInitialAmount] = useState('1000')
  const [monthlyContribution, setMonthlyContribution] = useState('500')
  const [annualRate, setAnnualRate] = useState('12')
  const [periodYears, setPeriodYears] = useState('10')
  const [compoundingFrequency, setCompoundingFrequency] =
    useState<CompoundingFrequency>('monthly')

  const result = useMemo(() => {
    const principal = parseFloat(initialAmount.replace(',', '.')) || 0
    const monthly = parseFloat(monthlyContribution.replace(',', '.')) || 0
    const rate = parseFloat(annualRate.replace(',', '.')) || 0
    const years = parseInt(periodYears) || 1

    return calculateCompoundInterest(
      principal,
      monthly,
      rate,
      years,
      compoundingFrequency
    )
  }, [initialAmount, monthlyContribution, annualRate, periodYears, compoundingFrequency])

  const chartData = result.yearlyBreakdown.map((item) => ({
    year: `${item.year}`,
    total: item.amount,
    contributed: item.contributed,
    interest: item.interest,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="h-5 w-5" />
          {t('finances.calculator.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Form */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Initial Amount */}
          <div className="space-y-2">
            <Label>{t('finances.calculator.initialAmount')}</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                {currency === 'BRL' ? 'R$' : '$'}
              </span>
              <Input
                type="text"
                inputMode="decimal"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Monthly Contribution */}
          <div className="space-y-2">
            <Label>{t('finances.calculator.monthlyContribution')}</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                {currency === 'BRL' ? 'R$' : '$'}
              </span>
              <Input
                type="text"
                inputMode="decimal"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Annual Rate */}
          <div className="space-y-2">
            <Label>{t('finances.calculator.annualRate')}</Label>
            <div className="relative">
              <Input
                type="text"
                inputMode="decimal"
                value={annualRate}
                onChange={(e) => setAnnualRate(e.target.value)}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                %
              </span>
            </div>
          </div>

          {/* Period */}
          <div className="space-y-2">
            <Label>{t('finances.calculator.period')}</Label>
            <div className="relative">
              <Input
                type="number"
                min="1"
                max="50"
                value={periodYears}
                onChange={(e) => setPeriodYears(e.target.value)}
                className="pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                {t('finances.calculator.years')}
              </span>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-primary/10 p-4 text-center">
            <PiggyBank className="mx-auto h-6 w-6 text-primary mb-2" />
            <p className="text-xs text-muted-foreground mb-1">
              {t('finances.calculator.totalContributed')}
            </p>
            <p className="text-lg font-bold">
              {formatCurrency(result.totalContributed, currency)}
            </p>
          </div>

          <div className="rounded-lg bg-green-500/10 p-4 text-center">
            <TrendingUp className="mx-auto h-6 w-6 text-green-500 mb-2" />
            <p className="text-xs text-muted-foreground mb-1">
              {t('finances.calculator.totalInterest')}
            </p>
            <p className="text-lg font-bold text-green-500">
              {formatCurrency(result.totalInterest, currency)}
            </p>
          </div>

          <div className="rounded-lg bg-blue-500/10 p-4 text-center">
            <Percent className="mx-auto h-6 w-6 text-blue-500 mb-2" />
            <p className="text-xs text-muted-foreground mb-1">
              {t('finances.calculator.finalAmount')}
            </p>
            <p className="text-lg font-bold text-blue-500">
              {formatCurrency(result.finalAmount, currency)}
            </p>
          </div>
        </div>

        {/* Chart */}
        <Tabs defaultValue="chart">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chart">{t('finances.calculator.chart')}</TabsTrigger>
            <TabsTrigger value="table">{t('finances.calculator.table')}</TabsTrigger>
          </TabsList>

          <TabsContent value="chart" className="mt-4">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="year"
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    axisLine={{ stroke: 'var(--border)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                      if (value >= 1000) return `${(value / 1000).toFixed(0)}k`
                      return value.toString()
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--card-foreground)',
                    }}
                    labelStyle={{ color: 'var(--card-foreground)' }}
                    itemStyle={{ color: 'var(--card-foreground)' }}
                    formatter={(value) => formatCurrency(value as number, currency)}
                    labelFormatter={(label) => `${t('finances.calculator.year')} ${label}`}
                  />
                  <Legend wrapperStyle={{ color: 'var(--foreground)' }} />
                  <Area
                    type="monotone"
                    dataKey="contributed"
                    name={t('finances.calculator.contributed')}
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="interest"
                    name={t('finances.calculator.interest')}
                    stackId="1"
                    stroke="#22c55e"
                    fill="#22c55e"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="table" className="mt-4">
            <div className="max-h-[250px] overflow-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">
                      {t('finances.calculator.year')}
                    </th>
                    <th className="px-3 py-2 text-right font-medium">
                      {t('finances.calculator.contributed')}
                    </th>
                    <th className="px-3 py-2 text-right font-medium">
                      {t('finances.calculator.interest')}
                    </th>
                    <th className="px-3 py-2 text-right font-medium">
                      {t('finances.calculator.total')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.yearlyBreakdown.map((item) => (
                    <tr key={item.year} className="border-t">
                      <td className="px-3 py-2">{item.year}</td>
                      <td className="px-3 py-2 text-right">
                        {formatCurrency(item.contributed, currency)}
                      </td>
                      <td className="px-3 py-2 text-right text-green-500">
                        {formatCurrency(item.interest, currency)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatCurrency(item.amount, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
