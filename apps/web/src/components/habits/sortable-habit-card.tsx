'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useHabitStreak } from '@/hooks/queries/use-gamification'
import { Flame, TrendingUp, GripVertical } from 'lucide-react'
import type { Habit } from '@/types'

interface SortableHabitCardProps {
  habit: Habit
  last7Days: string[]
}

export function SortableHabitCard({ habit, last7Days }: SortableHabitCardProps) {
  const t = useTranslations('habits')
  const { data: streak } = useHabitStreak(habit.id)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const completionsThisWeek = habit.completions.filter((c) =>
    last7Days.includes(c.date)
  ).length
  const completionRate = Math.round((completionsThisWeek / 7) * 100)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'z-50 opacity-90' : ''}`}
    >
      <Card
        className={`group h-full cursor-pointer overflow-hidden transition-all duration-300 ${
          isDragging
            ? 'scale-105 shadow-xl shadow-black/10 ring-2 ring-primary dark:shadow-black/30'
            : 'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20'
        }`}
      >
        <CardContent className="p-0">
          {/* Color accent bar */}
          <div
            className="h-1 w-full"
            style={{ backgroundColor: habit.color }}
          />

          <div className="flex items-start gap-3 p-4">
            {/* Drag handle */}
            <button
              className="mt-0.5 cursor-grab touch-none rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </button>

            <Link href={`/habits/${habit.id}`} className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="h-4 w-4 shrink-0 rounded-lg shadow-sm"
                    style={{ backgroundColor: habit.color }}
                  />
                  <h3 className="font-semibold truncate">{habit.title}</h3>
                </div>
                <Badge variant="secondary" className="shrink-0 rounded-lg px-2 py-0.5 text-xs font-medium">
                  {habit.frequency.type === 'daily' && t('frequencyDaily')}
                  {habit.frequency.type === 'weekly' &&
                    `${habit.frequency.daysPerWeek}x/sem`}
                  {habit.frequency.type === 'specificDays' &&
                    `${habit.frequency.days.length}x/sem`}
                  {habit.frequency.type === 'monthly' &&
                    `${habit.frequency.timesPerMonth}x/mês`}
                </Badge>
              </div>

              {/* Tracking info for quantitative habits */}
              {habit.tracking.type === 'quantitative' && (
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Meta: <span className="font-medium text-foreground">{habit.tracking.target}</span> {habit.tracking.unit}
                </p>
              )}

              {/* Streak and stats */}
              <div className="mt-3 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-500/10">
                    <Flame className="h-3.5 w-3.5 text-orange-500" />
                  </div>
                  <span className="font-medium">{streak?.currentStreak || 0}</span>
                  <span className="text-muted-foreground">dias</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="font-medium">{completionRate}%</span>
                  <span className="text-muted-foreground hidden sm:inline">esta semana</span>
                </div>
              </div>

              {/* Mini heatmap for last 7 days */}
              <div className="mt-4 flex gap-1.5">
                {last7Days.map((date) => {
                  const completion = habit.completions.find((c) => c.date === date)
                  const isCompleted = !!completion

                  return (
                    <div
                      key={date}
                      className={`h-7 flex-1 rounded-lg transition-all duration-200 ${
                        isCompleted
                          ? 'shadow-sm'
                          : 'bg-muted/50 group-hover:bg-muted'
                      }`}
                      style={{
                        backgroundColor: isCompleted ? habit.color : undefined,
                        opacity: isCompleted ? 1 : undefined,
                      }}
                      title={date}
                    />
                  )
                })}
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
