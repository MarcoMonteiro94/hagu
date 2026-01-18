'use client'

import { useMemo } from 'react'
import { useSettingsStore } from '@/stores/settings'
import type { Habit } from '@/types'

interface HabitYearHeatmapProps {
  habit: Habit
  weeks?: number
  cellSize?: number
  gap?: number
}

function getMonthLabel(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, { month: 'short' })
}

function formatDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function HabitYearHeatmap({
  habit,
  weeks = 52,
  cellSize = 10,
  gap = 2,
}: HabitYearHeatmapProps) {
  const locale = useSettingsStore((state) => state.locale)

  const { days, months, completionMap } = useMemo(() => {
    const totalDays = weeks * 7
    const days: { date: string; dayOfWeek: number; value: number }[] = []
    const monthLabels: { label: string; weekIndex: number }[] = []
    const completionMap = new Map<string, number>()

    // Build completion map for quick lookup
    habit.completions.forEach((c) => {
      completionMap.set(c.date, c.value)
    })

    let lastMonth = -1
    let weekIndex = 0

    for (let i = totalDays - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dayOfWeek = date.getDay()
      const month = date.getMonth()

      // Track month changes for labels
      if (month !== lastMonth && dayOfWeek === 0) {
        monthLabels.push({
          label: getMonthLabel(date, locale),
          weekIndex,
        })
        lastMonth = month
      }

      if (dayOfWeek === 6) {
        weekIndex++
      }

      days.push({
        date: dateStr,
        dayOfWeek,
        value: completionMap.get(dateStr) || 0,
      })
    }

    return { days, months: monthLabels, completionMap }
  }, [habit.completions, weeks, locale])

  // Group days into weeks (columns)
  const columns: (typeof days[number] | null)[][] = []
  let currentColumn: (typeof days[number] | null)[] = []

  // Find the first day and pad to start from Sunday
  if (days.length > 0) {
    const firstDayOfWeek = days[0].dayOfWeek
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentColumn.push(null)
    }
  }

  days.forEach((day) => {
    currentColumn.push(day)
    if (day.dayOfWeek === 6) {
      columns.push(currentColumn)
      currentColumn = []
    }
  })

  // Push remaining days
  if (currentColumn.length > 0) {
    while (currentColumn.length < 7) {
      currentColumn.push(null)
    }
    columns.push(currentColumn)
  }

  const dayLabels =
    locale === 'pt-BR'
      ? ['Dom', '', 'Ter', '', 'Qui', '', 'Sáb']
      : ['Sun', '', 'Tue', '', 'Thu', '', 'Sat']

  // Calculate max value for intensity scaling (for quantitative habits)
  const maxValue = Math.max(
    1,
    ...Array.from(completionMap.values()).filter((v) => v > 0)
  )

  function getIntensity(value: number): number {
    if (value === 0) return 0
    if (habit.tracking.type === 'boolean') return 1
    // For quantitative, scale from 0.3 to 1 based on value vs target
    const target = habit.tracking.target || maxValue
    return Math.min(1, Math.max(0.3, value / target))
  }

  return (
    <div className="space-y-2">
      {/* Month labels */}
      <div
        className="flex text-xs text-muted-foreground"
        style={{ paddingLeft: 32, gap }}
      >
        {months.map((month, i) => {
          const nextMonth = months[i + 1]
          const weeksSpan = nextMonth
            ? nextMonth.weekIndex - month.weekIndex
            : columns.length - month.weekIndex
          const width = weeksSpan * (cellSize + gap) - gap

          return (
            <span
              key={`${month.label}-${month.weekIndex}`}
              style={{ width, minWidth: width }}
              className="capitalize truncate"
            >
              {month.label}
            </span>
          )
        })}
      </div>

      {/* Heatmap grid */}
      <div className="flex" style={{ gap }}>
        {/* Day labels */}
        <div className="flex flex-col text-xs text-muted-foreground" style={{ gap }}>
          {dayLabels.map((label, i) => (
            <div
              key={i}
              className="flex items-center justify-end pr-1"
              style={{ height: cellSize, width: 28 }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex" style={{ gap }}>
          {columns.map((column, colIndex) => (
            <div key={colIndex} className="flex flex-col" style={{ gap }}>
              {column.map((day, dayIndex) => {
                if (!day) {
                  return (
                    <div
                      key={`empty-${colIndex}-${dayIndex}`}
                      style={{ width: cellSize, height: cellSize }}
                    />
                  )
                }

                const intensity = getIntensity(day.value)
                const isCompleted = day.value > 0
                const isToday = day.date === new Date().toISOString().split('T')[0]

                return (
                  <div
                    key={day.date}
                    className={`rounded-sm transition-all hover:scale-110 ${
                      isToday ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''
                    }`}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: isCompleted
                        ? habit.color
                        : 'var(--muted)',
                      opacity: isCompleted ? intensity : 0.2,
                    }}
                    title={`${formatDate(new Date(day.date), locale)}: ${
                      isCompleted
                        ? habit.tracking.type === 'quantitative'
                          ? `${day.value} ${habit.tracking.unit}`
                          : 'Completado'
                        : 'Não completado'
                    }`}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
        <span className="text-muted-foreground/70">
          {habit.completions.length} conclusões no último ano
        </span>
        <div className="flex items-center gap-2">
          <span>Menos</span>
          <div className="flex" style={{ gap: 2 }}>
            <div
              className="rounded-sm"
              style={{
                width: cellSize - 2,
                height: cellSize - 2,
                backgroundColor: 'var(--muted)',
                opacity: 0.2,
              }}
            />
            {[0.3, 0.5, 0.7, 1].map((opacity) => (
              <div
                key={opacity}
                className="rounded-sm"
                style={{
                  width: cellSize - 2,
                  height: cellSize - 2,
                  backgroundColor: habit.color,
                  opacity,
                }}
              />
            ))}
          </div>
          <span>Mais</span>
        </div>
      </div>
    </div>
  )
}
