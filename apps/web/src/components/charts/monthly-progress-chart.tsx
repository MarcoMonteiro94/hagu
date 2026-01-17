'use client'

import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useActiveHabits } from '@/hooks/queries/use-habits'
import { useSettingsStore } from '@/stores/settings'

function getLast30Days(): { date: string; dayLabel: string }[] {
  const locale = useSettingsStore.getState().locale
  return Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - i))
    return {
      date: date.toISOString().split('T')[0],
      dayLabel: date.toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
    }
  })
}

interface MonthlyProgressChartProps {
  height?: number
  showGrid?: boolean
  gradientColor?: string
}

export function MonthlyProgressChart({
  height = 200,
  showGrid = true,
  gradientColor = 'var(--primary)',
}: MonthlyProgressChartProps) {
  const { data: habits = [] } = useActiveHabits()

  const data = useMemo(() => {
    const last30Days = getLast30Days()

    return last30Days.map(({ date, dayLabel }) => {
      const completions = habits.reduce((acc, habit) => {
        const completed = habit.completions.some((c) => c.date === date)
        return acc + (completed ? 1 : 0)
      }, 0)

      // Calculate completion rate (percentage)
      const rate = habits.length > 0 ? Math.round((completions / habits.length) * 100) : 0

      return {
        day: dayLabel,
        date,
        completions,
        rate,
      }
    })
  }, [habits])

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <defs>
          <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={gradientColor} stopOpacity={0.3} />
            <stop offset="95%" stopColor={gradientColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
        <XAxis
          dataKey="day"
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval={4}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
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
          itemStyle={{ color: 'var(--foreground)' }}
          formatter={(value) => [`${value}%`, 'Completion Rate']}
        />
        <Area
          type="monotone"
          dataKey="rate"
          stroke={gradientColor}
          fill="url(#progressGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
