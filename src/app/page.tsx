'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { PageTransition, StaggerContainer, StaggerItem, motion } from '@/components/ui/motion'
import {
  useActiveHabits,
  useToggleCompletion,
  useSetCompletionValue,
  useRemoveCompletion,
} from '@/hooks/queries/use-habits'
import { useTodayTasks, useSetTaskStatus } from '@/hooks/queries/use-tasks'
import {
  useUserStats,
  useUpdateGamificationStreak,
  useIncrementHabitsCompleted,
  useIncrementTasksCompleted,
} from '@/hooks/queries/use-gamification'
import { useSettingsStore } from '@/stores/settings'
import { HabitFormDialog, QuantitativeHabitInput } from '@/components/habits'
import { TaskFormDialog } from '@/components/tasks'
import { StreakSparkline } from '@/components/charts'
import { HabitCardSkeleton, TaskCardSkeleton } from '@/components/skeletons'
import { Flame, Star, CheckCircle2, Plus, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

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

  const { data: habits = [], isLoading: isLoadingHabits } = useActiveHabits()
  const { tasks, isLoading: isLoadingTasks } = useTodayTasks()
  const toggleCompletionMutation = useToggleCompletion()
  const setCompletionValueMutation = useSetCompletionValue()
  const removeCompletionMutation = useRemoveCompletion()
  const setTaskStatusMutation = useSetTaskStatus()
  const { data: stats } = useUserStats()
  const updateStreakMutation = useUpdateGamificationStreak()
  const incrementHabitsMutation = useIncrementHabitsCompleted()
  const incrementTasksMutation = useIncrementTasksCompleted()
  const locale = useSettingsStore((state) => state.locale)
  const userName = useSettingsStore((state) => state.userName)

  const currentStreak = stats?.currentStreak ?? 0
  const level = stats?.level ?? 1

  useEffect(() => {
    setMounted(true)
  }, [])

  // Use default values during SSR to prevent hydration mismatch
  const displayStreak = mounted ? currentStreak : 0
  const displayLevel = mounted ? level : 1
  const displayLocale = mounted ? locale : 'pt-BR'
  const displayUserName = mounted ? userName : undefined

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

  const completedHabits = todayHabits.filter((habit) => {
    const completion = habit.completions.find((c) => c.date === today)
    if (!completion) return false
    if (habit.tracking.type === 'quantitative') {
      return completion.value >= habit.tracking.target
    }
    return true // boolean habit with completion = completed
  })

  const habitProgress =
    todayHabits.length > 0
      ? Math.round((completedHabits.length / todayHabits.length) * 100)
      : 0

  const handleHabitToggle = (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId)
    const wasCompleted = habit?.completions.some((c) => c.date === today)

    toggleCompletionMutation.mutate({ habitId, date: today })

    // Update gamification when completing (not uncompleting)
    if (!wasCompleted) {
      updateStreakMutation.mutate({ habitId, date: today })
      incrementHabitsMutation.mutate()
      toast.success('Hábito concluído! 🎉')
    }
  }

  const handleQuantitativeValueChange = (habitId: string, value: number) => {
    const habit = habits.find((h) => h.id === habitId)
    if (!habit || habit.tracking.type !== 'quantitative') return

    const wasCompleted = habit.completions.some((c) => c.date === today)
    const isNowCompleted = value >= habit.tracking.target

    setCompletionValueMutation.mutate({ habitId, date: today, value })

    // Update gamification when first completing (reaching target)
    if (!wasCompleted && isNowCompleted) {
      updateStreakMutation.mutate({ habitId, date: today })
      incrementHabitsMutation.mutate()
      toast.success('Meta atingida! 🎯')
    }
  }

  const handleQuantitativeRemove = (habitId: string) => {
    removeCompletionMutation.mutate({ habitId, date: today })
  }

  const handleTaskToggle = (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'pending' : 'done'
    setTaskStatusMutation.mutate({ id: taskId, status: newStatus as 'pending' | 'done' })

    // Award XP when completing task
    if (newStatus === 'done') {
      incrementTasksMutation.mutate()
      toast.success('Tarefa concluída! ✅')
    }
  }

  return (
    <PageTransition className="container mx-auto max-w-md space-y-6 p-4 lg:max-w-4xl lg:p-6">
      {/* Header */}
      <header className="space-y-1">
        <motion.h1
          className="text-2xl font-bold capitalize"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {formatDate(displayLocale)}
        </motion.h1>
        <motion.p
          className="text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          {displayUserName ? t('greetingWithName', { name: displayUserName }) : t('greeting')}
        </motion.p>
      </header>

      {/* Quick Stats */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
      >
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
        {mounted && (
          <div className="hidden sm:block">
            <StreakSparkline width={100} height={36} color="var(--primary)" />
          </div>
        )}
      </motion.div>

      {/* Content Grid - 2 columns on desktop */}
      <div className="grid gap-6 lg:grid-cols-2">
      {/* Habits Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{tNav('habits')}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {t('habitsProgress', {
                  completed: completedHabits.length,
                  total: todayHabits.length,
                })}
              </Badge>
              <HabitFormDialog>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                </Button>
              </HabitFormDialog>
            </div>
          </div>
          {todayHabits.length > 0 && (
            <Progress value={habitProgress} className="h-2" />
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoadingHabits ? (
            <HabitCardSkeleton count={3} />
          ) : todayHabits.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {t('noHabitsToday')}
            </p>
          ) : (
            <>
              {todayHabits.map((habit) => {
                const completion = habit.completions.find((c) => c.date === today)
                const isQuantitative = habit.tracking.type === 'quantitative'
                const isCompleted = isQuantitative && habit.tracking.type === 'quantitative'
                  ? (completion?.value ?? 0) >= habit.tracking.target
                  : !!completion

                return (
                  <div
                    key={habit.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                    style={{ borderLeftColor: habit.color, borderLeftWidth: 4 }}
                  >
                    {isQuantitative && habit.tracking.type === 'quantitative' ? (
                      <QuantitativeHabitInput
                        target={habit.tracking.target}
                        unit={habit.tracking.unit}
                        completion={completion}
                        onValueChange={(value) => handleQuantitativeValueChange(habit.id, value)}
                        onRemove={() => handleQuantitativeRemove(habit.id)}
                      />
                    ) : (
                      <>
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
                        </div>
                        {isCompleted && (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                      </>
                    )}
                    {isQuantitative && (
                      <div className="flex-1">
                        <p
                          className={
                            isCompleted ? 'text-muted-foreground line-through' : ''
                          }
                        >
                          {habit.title}
                        </p>
                      </div>
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
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {t('tasksRemaining', { count: tasks.length })}
              </Badge>
              <TaskFormDialog>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                </Button>
              </TaskFormDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoadingTasks ? (
            <TaskCardSkeleton count={3} />
          ) : tasks.length === 0 ? (
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
          <motion.div
            className="rounded-lg bg-green-500/10 p-4 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-500" />
            </motion.div>
            <p className="font-medium text-green-500">{t('allDone')}</p>
          </motion.div>
        )}
    </PageTransition>
  )
}
