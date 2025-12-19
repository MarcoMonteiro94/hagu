'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { useActiveHabits } from '@/stores/habits'
import { useSettingsStore } from '@/stores/settings'

function getLast7Days(): { date: string; dayLabel: string }[] {
  const locale = useSettingsStore.getState().locale
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return {
      date: date.toISOString().split('T')[0],
      dayLabel: date.toLocaleDateString(locale, { weekday: 'short' }),
    }
  })
}

interface WeeklyActivityChartProps {
  height?: number
  showGrid?: boolean
  barColor?: string
}

export function WeeklyActivityChart({
  height = 200,
  showGrid = true,
  barColor = 'var(--primary)',
}: WeeklyActivityChartProps) {
  const habits = useActiveHabits()

  const data = useMemo(() => {
    const last7Days = getLast7Days()
    const todayStr = new Date().toISOString().split('T')[0]

    return last7Days.map(({ date, dayLabel }) => {
      const completions = habits.reduce((acc, habit) => {
        const completed = habit.completions.some((c) => c.date === date)
        return acc + (completed ? 1 : 0)
      }, 0)

      return {
        day: dayLabel,
        date,
        completions,
        isToday: date === todayStr,
      }
    })
  }, [habits])

  const maxCompletions = Math.max(...data.map((d) => d.completions), 1)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" opacity={0.3} />}
        <XAxis
          dataKey="day"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          domain={[0, maxCompletions]}
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
          formatter={(value) => [value, 'Completions']}
        />
        <Bar dataKey="completions" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.isToday ? 'var(--primary)' : barColor}
              opacity={entry.isToday ? 1 : 0.7}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
