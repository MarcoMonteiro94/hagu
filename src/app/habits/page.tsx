'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HabitFormDialog } from '@/components/habits'
import { useActiveHabits } from '@/stores/habits'
import { useGamificationStore } from '@/stores/gamification'
import { Flame, TrendingUp, Plus } from 'lucide-react'

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date.toISOString().split('T')[0]
  })
}

export default function HabitsPage() {
  const t = useTranslations('habits')
  const habits = useActiveHabits()
  const getStreakForHabit = useGamificationStore((state) => state.getStreakForHabit)

  const last7Days = getLast7Days()

  return (
    <div className="container mx-auto max-w-md space-y-6 p-4 lg:max-w-4xl lg:p-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <HabitFormDialog />
      </header>

      {/* Habits List */}
      {habits.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="mb-4 text-muted-foreground">{t('noHabits')}</p>
            <HabitFormDialog>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                {t('createFirst')}
              </Button>
            </HabitFormDialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {habits.map((habit) => {
            const streak = getStreakForHabit(habit.id)
            const completionsThisWeek = habit.completions.filter((c) =>
              last7Days.includes(c.date)
            ).length

            const completionRate = Math.round((completionsThisWeek / 7) * 100)

            return (
              <Link key={habit.id} href={`/habits/${habit.id}`}>
                <Card className="cursor-pointer transition-colors hover:bg-accent/50">
                  <CardContent className="p-4">
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
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
