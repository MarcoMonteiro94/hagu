'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { useActiveHabits, useHabitsStore } from '@/stores/habits'
import { useTodayTasks, useTasksStore } from '@/stores/tasks'
import { useGamificationStore } from '@/stores/gamification'
import { useSettingsStore } from '@/stores/settings'
import { HabitFormDialog } from '@/components/habits'
import { Flame, Star, CheckCircle2, Plus, ChevronRight } from 'lucide-react'

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

function formatDate(locale: string): string {
  return new Date().toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export default function HomePage() {
  const t = useTranslations('home')
  const tNav = useTranslations('nav')
  const [mounted, setMounted] = useState(false)

  const habits = useActiveHabits()
  const tasks = useTodayTasks()
  const toggleCompletion = useHabitsStore((state) => state.toggleCompletion)
  const setTaskStatus = useTasksStore((state) => state.setTaskStatus)
  const { currentStreak, level, updateStreak, incrementHabitsCompleted, incrementTasksCompleted } = useGamificationStore()
  const locale = useSettingsStore((state) => state.locale)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Use default values during SSR to prevent hydration mismatch
  const displayStreak = mounted ? currentStreak : 0
  const displayLevel = mounted ? level : 1
  const displayLocale = mounted ? locale : 'pt-BR'

  const today = getTodayString()
  const dayOfWeek = new Date().getDay()

  // Filter habits that should be done today
  const todayHabits = habits.filter((habit) => {
    if (habit.frequency.type === 'daily') return true
    if (habit.frequency.type === 'specificDays') {
      return habit.frequency.days.includes(dayOfWeek)
    }
    if (habit.frequency.type === 'weekly' || habit.frequency.type === 'monthly') {
      return true // Show these habits always, user decides when to do
    }
    return false
  })

  const completedHabits = todayHabits.filter((habit) =>
    habit.completions.some((c) => c.date === today)
  )

  const habitProgress =
    todayHabits.length > 0
      ? Math.round((completedHabits.length / todayHabits.length) * 100)
      : 0

  const handleHabitToggle = (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId)
    const wasCompleted = habit?.completions.some((c) => c.date === today)

    toggleCompletion(habitId, today)

    // Update gamification when completing (not uncompleting)
    if (!wasCompleted) {
      updateStreak(habitId, today)
      incrementHabitsCompleted()
    }
  }

  const handleTaskToggle = (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'pending' : 'done'
    setTaskStatus(taskId, newStatus as 'pending' | 'done')

    // Award XP when completing task
    if (newStatus === 'done') {
      incrementTasksCompleted()
    }
  }

  return (
    <div className="container mx-auto max-w-md space-y-6 p-4 lg:max-w-4xl lg:p-6">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-2xl font-bold capitalize">{formatDate(displayLocale)}</h1>
        <p className="text-muted-foreground">{t('greeting')}</p>
      </header>

      {/* Quick Stats */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <span className="text-sm font-medium">
            {t('streak', { count: displayStreak })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          <span className="text-sm font-medium">{t('level', { level: displayLevel })}</span>
        </div>
      </div>

      {/* Content Grid - 2 columns on desktop */}
      <div className="grid gap-6 lg:grid-cols-2">
      {/* Habits Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{tNav('habits')}</CardTitle>
            <Badge variant="secondary">
              {t('habitsProgress', {
                completed: completedHabits.length,
                total: todayHabits.length,
              })}
            </Badge>
          </div>
          {todayHabits.length > 0 && (
            <Progress value={habitProgress} className="h-2" />
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {todayHabits.length === 0 ? (
            <div className="py-4 text-center">
              <p className="mb-3 text-sm text-muted-foreground">
                {t('noHabitsToday')}
              </p>
              <HabitFormDialog>
                <Button variant="outline" size="sm">
                  <Plus className="mr-1 h-4 w-4" />
                  Criar hábito
                </Button>
              </HabitFormDialog>
            </div>
          ) : (
            <>
              {todayHabits.map((habit) => {
                const isCompleted = habit.completions.some((c) => c.date === today)
                const completion = habit.completions.find((c) => c.date === today)

                return (
                  <div
                    key={habit.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                    style={{ borderLeftColor: habit.color, borderLeftWidth: 4 }}
                  >
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={() => handleHabitToggle(habit.id)}
                      className="h-5 w-5"
                    />
                    <div className="flex-1">
                      <p
                        className={
                          isCompleted ? 'text-muted-foreground line-through' : ''
                        }
                      >
                        {habit.title}
                      </p>
                      {habit.tracking.type === 'quantitative' && (
                        <p className="text-xs text-muted-foreground">
                          {completion?.value || 0} / {habit.tracking.target}{' '}
                          {habit.tracking.unit}
                        </p>
                      )}
                    </div>
                    {isCompleted && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                )
              })}
              <Link href="/habits">
                <Button variant="ghost" className="w-full" size="sm">
                  Ver todos
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>

      {/* Tasks Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{tNav('tasks')}</CardTitle>
            <Badge variant="secondary">
              {t('tasksRemaining', { count: tasks.length })}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {tasks.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {t('noTasksToday')}
            </p>
          ) : (
            <>
              {tasks.slice(0, 5).map((task) => {
                const priorityColors = {
                  low: 'bg-green-500',
                  medium: 'bg-yellow-500',
                  high: 'bg-orange-500',
                  urgent: 'bg-red-500',
                }

                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <Checkbox
                      checked={task.status === 'done'}
                      onCheckedChange={() => handleTaskToggle(task.id, task.status)}
                      className="h-5 w-5"
                    />
                    <div className="flex-1">
                      <p
                        className={
                          task.status === 'done'
                            ? 'text-muted-foreground line-through'
                            : ''
                        }
                      >
                        {task.title}
                      </p>
                      {task.subtasks.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {task.subtasks.filter((s) => s.done).length}/
                          {task.subtasks.length} subtarefas
                        </p>
                      )}
                    </div>
                    {task.priority && (
                      <div
                        className={`h-2 w-2 rounded-full ${priorityColors[task.priority]}`}
                      />
                    )}
                  </div>
                )
              })}
              {tasks.length > 5 && (
                <Link href="/tasks">
                  <Button variant="ghost" className="w-full" size="sm">
                    Ver todas ({tasks.length - 5} mais)
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </>
          )}
        </CardContent>
      </Card>
      </div>

      {/* All done message */}
      {todayHabits.length > 0 &&
        completedHabits.length === todayHabits.length &&
        tasks.length === 0 && (
          <div className="rounded-lg bg-green-500/10 p-4 text-center">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-500" />
            <p className="font-medium text-green-500">{t('allDone')}</p>
          </div>
        )}
    </div>
  )
}
