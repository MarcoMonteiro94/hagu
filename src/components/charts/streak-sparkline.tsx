'use client'

import { useMemo } from 'react'
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts'
import { useActiveHabits } from '@/hooks/queries/use-habits'

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date.toISOString().split('T')[0]
  })
}

interface StreakSparklineProps {
  width?: number
  height?: number
  color?: string
}

export function StreakSparkline({
  width = 80,
  height = 32,
  color = 'var(--primary)',
}: StreakSparklineProps) {
  const { data: habits = [] } = useActiveHabits()

  const data = useMemo(() => {
    const last7Days = getLast7Days()

    return last7Days.map((date) => {
      const completions = habits.reduce((acc, habit) => {
        const completed = habit.completions.some((c) => c.date === date)
        return acc + (completed ? 1 : 0)
      }, 0)

      const rate = habits.length > 0 ? (completions / habits.length) * 100 : 0

      return { date, rate }
    })
  }, [habits])

  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <Line
          type="monotone"
          dataKey="rate"
          stroke={color}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
