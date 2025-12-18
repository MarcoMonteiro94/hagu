'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useGamificationStore } from '@/stores/gamification'
import { Flame, TrendingUp, GripVertical } from 'lucide-react'
import type { Habit } from '@/types'

interface SortableHabitCardProps {
  habit: Habit
  last7Days: string[]
}

export function SortableHabitCard({ habit, last7Days }: SortableHabitCardProps) {
  const t = useTranslations('habits')
  const getStreakForHabit = useGamificationStore((state) => state.getStreakForHabit)

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

  const streak = getStreakForHabit(habit.id)
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
        className={`h-full cursor-pointer transition-all ${
          isDragging ? 'scale-105 shadow-lg ring-2 ring-primary' : 'hover:scale-[1.02] hover:bg-accent/50'
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            {/* Drag handle */}
            <button
              className="mt-1 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-5 w-5" />
            </button>

            <Link href={`/habits/${habit.id}`} className="flex-1">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: habit.color }}
                    />
                    <h3 className="font-medium">{habit.title}</h3>
                  </div>
                  {habit.description && (
                    <p className="text-sm text-muted-foreground">
                      {habit.description}
                    </p>
                  )}
                </div>
                <Badge variant="secondary">
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
                <p className="mt-1 text-sm text-muted-foreground">
                  Meta: {habit.tracking.target} {habit.tracking.unit}
                </p>
              )}

              {/* Streak and stats */}
              <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span>{streak?.currentStreak || 0} dias</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>{completionRate}% esta semana</span>
                </div>
              </div>

              {/* Mini heatmap for last 7 days */}
              <div className="mt-3 flex gap-1">
                {last7Days.map((date) => {
                  const completion = habit.completions.find((c) => c.date === date)
                  const isCompleted = !!completion

                  return (
                    <div
                      key={date}
                      className={`h-6 flex-1 rounded transition-colors ${
                        isCompleted ? '' : 'bg-muted'
                      }`}
                      style={{
                        backgroundColor: isCompleted ? habit.color : undefined,
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
