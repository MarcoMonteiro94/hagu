'use client'

import { useMemo } from 'react'
import type { Habit } from '@/types'

interface HabitHeatmapProps {
  habit: Habit
  weeks?: number
}

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString('pt-BR', { month: 'short' })
}

export function HabitHeatmap({ habit, weeks = 12 }: HabitHeatmapProps) {
  const { days, months } = useMemo(() => {
    const totalDays = weeks * 7
    const days: { date: string; dayOfWeek: number; isCompleted: boolean }[] = []
    const monthLabels: { label: string; index: number }[] = []

    let lastMonth = -1

    for (let i = totalDays - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dayOfWeek = date.getDay()
      const month = date.getMonth()

      // Track month changes for labels
      if (month !== lastMonth) {
        monthLabels.push({
          label: getMonthLabel(date),
          index: totalDays - 1 - i,
        })
        lastMonth = month
      }

      days.push({
        date: dateStr,
        dayOfWeek,
        isCompleted: habit.completions.some((c) => c.date === dateStr),
      })
    }

    return { days, months: monthLabels }
  }, [habit.completions, weeks])

  // Group days into weeks (columns)
  const columns: typeof days[] = []
  for (let i = 0; i < days.length; i += 7) {
    columns.push(days.slice(i, i + 7))
  }

  // Pad first column to start from Sunday
  if (columns[0] && columns[0].length < 7) {
    const padding = 7 - columns[0].length
    const paddedColumn = [
      ...Array(padding).fill(null),
      ...columns[0],
    ]
    columns[0] = paddedColumn
  }

  const dayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

  return (
    <div className="space-y-2">
      {/* Month labels */}
      <div className="flex gap-[3px] pl-6 text-xs text-muted-foreground">
        {months.slice(0, -1).map((month, i) => {
          const nextMonth = months[i + 1]
          const width = nextMonth
            ? Math.floor((nextMonth.index - month.index) / 7) * 13
            : 52
          return (
            <span
              key={`${month.label}-${i}`}
              style={{ minWidth: width }}
              className="capitalize"
            >
              {month.label}
            </span>
          )
        })}
      </div>

      {/* Heatmap grid */}
      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-[3px] text-xs text-muted-foreground">
          {dayLabels.map((label, i) => (
            <div key={i} className="flex h-[10px] w-4 items-center justify-end">
              {i % 2 === 1 && label}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-[3px]">
          {columns.map((column, colIndex) => (
            <div key={colIndex} className="flex flex-col gap-[3px]">
              {column.map((day, dayIndex) => {
                if (!day) {
                  return (
                    <div
                      key={`empty-${dayIndex}`}
                      className="h-[10px] w-[10px]"
                    />
                  )
                }

                return (
                  <div
                    key={day.date}
                    className={`h-[10px] w-[10px] rounded-sm transition-colors ${
                      day.isCompleted ? '' : 'bg-muted'
                    }`}
                    style={{
                      backgroundColor: day.isCompleted ? habit.color : undefined,
                      opacity: day.isCompleted ? 1 : 0.3,
                    }}
                    title={`${day.date}: ${day.isCompleted ? 'Completado' : 'Não completado'}`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <span>Menos</span>
        <div className="flex gap-[3px]">
          <div className="h-[10px] w-[10px] rounded-sm bg-muted opacity-30" />
          <div
            className="h-[10px] w-[10px] rounded-sm"
            style={{ backgroundColor: habit.color, opacity: 0.4 }}
          />
          <div
            className="h-[10px] w-[10px] rounded-sm"
            style={{ backgroundColor: habit.color, opacity: 0.7 }}
          />
          <div
            className="h-[10px] w-[10px] rounded-sm"
            style={{ backgroundColor: habit.color }}
          />
        </div>
        <span>Mais</span>
      </div>
    </div>
  )
}
