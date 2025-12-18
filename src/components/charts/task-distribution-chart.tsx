'use client'

import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import { useTasksStore } from '@/stores/tasks'

const STATUS_COLORS = {
  pending: '#6b7280',
  in_progress: '#3b82f6',
  done: '#22c55e',
}

interface TaskDistributionChartProps {
  height?: number
  showLegend?: boolean
}

export function TaskDistributionChart({
  height = 200,
  showLegend = true,
}: TaskDistributionChartProps) {
  const t = useTranslations('tasks')
  const tasks = useTasksStore((state) => state.tasks)

  const data = useMemo(() => {
    const pending = tasks.filter((t) => t.status === 'pending').length
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length
    const done = tasks.filter((t) => t.status === 'done').length

    return [
      { name: t('statusPending'), value: pending, status: 'pending' },
      { name: t('statusInProgress'), value: inProgress, status: 'in_progress' },
      { name: t('statusDone'), value: done, status: 'done' },
    ].filter((item) => item.value > 0)
  }, [tasks, t])

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-muted-foreground"
        style={{ height }}
      >
        {t('noTasks')}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={70}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS]}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
            fontSize: '12px',
          }}
          formatter={(value) => [value, 'Tasks']}
        />
        {showLegend && (
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-xs">{value}</span>}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  )
}
