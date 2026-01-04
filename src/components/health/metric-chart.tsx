'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { useSettings } from '@/hooks/queries/use-settings'
import { useSettingsStore } from '@/stores/settings'
import { TrendingUp, TrendingDown, Minus, Target } from 'lucide-react'
import type { MetricEntry } from '@/types'

interface MetricChartProps {
  data: MetricEntry[]
  color: string
  unit: string
  type: string
}

type Period = '7d' | '30d' | '90d' | '1y'

const PERIOD_DAYS: Record<Period, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '1y': 365,
}

const MOOD_LABELS = ['', 'Muito mal', 'Mal', 'Neutro', 'Bem', 'Muito bem']
const ENERGY_LABELS = ['', 'Exausto', 'Cansado', 'Normal', 'Energizado', 'Muito energizado']

function formatValue(value: number, type: string, unit: string): string {
  if (type === 'mood') return MOOD_LABELS[value] || String(value)
  if (type === 'energy') return ENERGY_LABELS[value] || String(value)
  return `${value}${unit ? ` ${unit}` : ''}`
}

function formatDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })
}

function calculateMovingAverage(data: { value: number }[], windowSize: number): number[] {
  const result: number[] = []
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1)
    const window = data.slice(start, i + 1)
    const avg = window.reduce((sum, d) => sum + d.value, 0) / window.length
    result.push(avg)
  }
  return result
}

function calculateWeeklyTrend(movingAvg: number[]): number {
  if (movingAvg.length < 2) return 0
  const recent = movingAvg[movingAvg.length - 1]
  const weekAgo = movingAvg[Math.max(0, movingAvg.length - 7)]
  return recent - weekAgo
}

export function MetricChart({ data, color, unit, type }: MetricChartProps) {
  const t = useTranslations('health')
  const locale = useSettingsStore((state) => state.locale)
  const { data: settings } = useSettings()

  const [period, setPeriod] = useState<Period>('30d')

  const isWeight = type === 'weight'
  const weightGoal = settings?.healthGoals?.weight

  const chartData = useMemo(() => {
    const days = PERIOD_DAYS[period]
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const filteredData = data
      .filter((entry) => new Date(entry.date) >= cutoffDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return filteredData.map((entry) => ({
      date: formatDate(entry.date, locale),
      fullDate: entry.date,
      value: entry.value,
      id: entry.id,
    }))
  }, [data, period, locale])

  const stats = useMemo(() => {
    if (chartData.length === 0) return null

    const values = chartData.map((d) => d.value)
    const minValue = Math.min(...values)
    const maxValue = Math.max(...values)
    const avg = values.reduce((a, b) => a + b, 0) / values.length
    const current = chartData[chartData.length - 1].value
    const first = chartData[0].value
    const variation = current - first

    // Find lowest weight entry
    const lowestEntry = chartData.reduce((min, entry) =>
      entry.value < min.value ? entry : min
    , chartData[0])

    // Calculate 7-day moving average trend
    const movingAvg = calculateMovingAverage(chartData, 7)
    const weeklyTrend = calculateWeeklyTrend(movingAvg)

    return {
      minValue,
      maxValue,
      avg,
      current,
      first,
      variation,
      lowestEntry,
      weeklyTrend,
    }
  }, [chartData])

  if (chartData.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-muted-foreground">
        {t('noData')}
      </div>
    )
  }

  const { minValue, maxValue, current, variation, lowestEntry, weeklyTrend } = stats!

  // Calculate Y-axis domain with padding
  const yMin = Math.floor(minValue - (maxValue - minValue) * 0.1)
  const yMax = Math.ceil(maxValue + (maxValue - minValue) * 0.1)

  const getTrendIcon = (trend: number) => {
    if (Math.abs(trend) < 0.1) return <Minus className="h-4 w-4 text-muted-foreground" />
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-green-500" />
    return <TrendingUp className="h-4 w-4 text-red-500" />
  }

  const getVariationColor = (value: number) => {
    if (Math.abs(value) < 0.1) return 'text-muted-foreground'
    // For weight, losing (negative) is typically green
    return isWeight
      ? value < 0 ? 'text-green-500' : 'text-red-500'
      : value > 0 ? 'text-green-500' : 'text-red-500'
  }

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex justify-center gap-1">
        {(['7d', '30d', '90d', '1y'] as Period[]).map((p) => (
          <Button
            key={p}
            variant={period === p ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setPeriod(p)}
            className="h-7 px-3 text-xs"
          >
            {t(`period${p.toUpperCase()}`)}
          </Button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${type}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              domain={[yMin, yMax]}
              tickFormatter={(value) => `${value}`}
              width={35}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--foreground)',
              }}
              labelStyle={{ color: 'var(--foreground)' }}
              formatter={(value) => [formatValue(value as number, type, unit), t(type)]}
            />
            {/* Weight goal reference line */}
            {isWeight && weightGoal?.target && (
              <ReferenceLine
                y={weightGoal.target}
                stroke="#22c55e"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: `${t('goal')}: ${weightGoal.target}${weightGoal.unit || 'kg'}`,
                  position: 'right',
                  fill: '#22c55e',
                  fontSize: 10,
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              fill={`url(#gradient-${type})`}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Row */}
      {isWeight ? (
        // Weight-specific stats
        <div className="grid grid-cols-2 gap-3">
          {/* Current Weight vs Goal */}
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">{t('currentWeight')}</p>
            <p className="text-lg font-semibold">{current} {unit}</p>
            {weightGoal?.target && (
              <p className="text-xs text-muted-foreground">
                {t('goal')}: {weightGoal.target} {weightGoal.unit || unit}
              </p>
            )}
          </div>

          {/* Remaining to goal */}
          {weightGoal?.target ? (
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-xs text-muted-foreground">{t('remaining')}</p>
              <p className={`text-lg font-semibold ${
                current <= weightGoal.target ? 'text-green-500' : ''
              }`}>
                {current <= weightGoal.target
                  ? t('goalAchieved')
                  : `${(current - weightGoal.target).toFixed(1)} ${unit}`
                }
              </p>
            </div>
          ) : (
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground">
                <Target className="h-4 w-4" />
              </div>
              <p className="text-xs text-muted-foreground">{t('noGoalSet')}</p>
            </div>
          )}

          {/* Period Variation */}
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">{t('periodVariation')}</p>
            <p className={`text-lg font-semibold ${getVariationColor(variation)}`}>
              {variation > 0 ? '+' : ''}{variation.toFixed(1)} {unit}
            </p>
          </div>

          {/* Lowest Weight */}
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">{t('lowestWeight')}</p>
            <p className="text-lg font-semibold">{lowestEntry.value} {unit}</p>
            <p className="text-xs text-muted-foreground">{lowestEntry.date}</p>
          </div>
        </div>
      ) : (
        // Generic stats for other metrics
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">{t('minimum')}</p>
            <p className="font-semibold">{formatValue(minValue, type, unit)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('average')}</p>
            <p className="font-semibold">
              {formatValue(Math.round(stats!.avg * 10) / 10, type, unit)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('maximum')}</p>
            <p className="font-semibold">{formatValue(maxValue, type, unit)}</p>
          </div>
        </div>
      )}

      {/* Trend indicator for weight */}
      {isWeight && chartData.length >= 7 && (
        <div className="flex items-center justify-center gap-2 rounded-lg bg-muted/50 p-3">
          {getTrendIcon(weeklyTrend)}
          <span className="text-sm">
            {t('weeklyTrend')}: {' '}
            <span className={getVariationColor(weeklyTrend)}>
              {weeklyTrend > 0 ? '+' : ''}{weeklyTrend.toFixed(2)} {unit}/{t('week')}
            </span>
          </span>
        </div>
      )}

      {/* Recent Entries */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">{t('recentEntries')}</p>
        <div className="max-h-32 space-y-1 overflow-y-auto">
          {[...chartData].reverse().slice(0, 7).map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm"
            >
              <span className="text-muted-foreground">{entry.date}</span>
              <span className="font-medium">{formatValue(entry.value, type, unit)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
