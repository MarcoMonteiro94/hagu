'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useActiveHabits } from '@/stores/habits'
import { useTasksStore } from '@/stores/tasks'
import { useGamificationStore } from '@/stores/gamification'
import {
  Flame,
  Star,
  Trophy,
  CheckCircle2,
  ListTodo,
  TrendingUp,
  Calendar,
  Target,
} from 'lucide-react'

function getLast30Days(): string[] {
  return Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - i))
    return date.toISOString().split('T')[0]
  })
}

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date.toISOString().split('T')[0]
  })
}

export default function StatsPage() {
  const t = useTranslations('stats')
  const [mounted, setMounted] = useState(false)
  const habits = useActiveHabits()
  const tasks = useTasksStore((state) => state.tasks)
  const {
    currentStreak,
    level,
    totalXp,
    habitsCompleted,
    tasksCompleted,
    getXpProgress,
    getXpForNextLevel,
  } = useGamificationStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Use default values during SSR to prevent hydration mismatch
  const displayStreak = mounted ? currentStreak : 0
  const displayLevel = mounted ? level : 1
  const displayTotalXp = mounted ? totalXp : 0
  const displayHabitsCompleted = mounted ? habitsCompleted : 0
  const displayTasksCompleted = mounted ? tasksCompleted : 0
  const displayXpProgress = mounted ? getXpProgress() : 0
  const displayXpForNext = mounted ? getXpForNextLevel() : 100

  const last30Days = getLast30Days()
  const last7Days = getLast7Days()

  // Calculate habit stats
  const totalHabitCompletions = habits.reduce(
    (acc, habit) => acc + habit.completions.length,
    0
  )

  const habitCompletionsLast30 = habits.reduce((acc, habit) => {
    const completions = habit.completions.filter((c) =>
      last30Days.includes(c.date)
    )
    return acc + completions.length
  }, 0)

  const habitCompletionsLast7 = habits.reduce((acc, habit) => {
    const completions = habit.completions.filter((c) =>
      last7Days.includes(c.date)
    )
    return acc + completions.length
  }, 0)

  // Calculate task stats
  const completedTasks = tasks.filter((t) => t.status === 'done')
  const pendingTasks = tasks.filter((t) => t.status !== 'done')


  return (
    <div className="container mx-auto max-w-md space-y-6 p-4 lg:max-w-4xl lg:p-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </header>

      {/* Level Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Star className="h-8 w-8" />
              </div>
              <div>
                <p className="text-3xl font-bold">{t('level', { level: displayLevel })}</p>
                <p className="text-sm text-muted-foreground">
                  {displayTotalXp} XP {t('total')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="h-6 w-6 text-orange-500" />
              <span className="text-2xl font-bold">{displayStreak}</span>
              <span className="text-sm text-muted-foreground">{t('days')}</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm">
              <span>{t('progressToNextLevel')}</span>
              <span>{displayXpProgress}%</span>
            </div>
            <Progress value={displayXpProgress} className="mt-2 h-3" />
            <p className="mt-1 text-xs text-muted-foreground">
              {displayXpForNext} XP {t('forNextLevel')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/10 p-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{displayHabitsCompleted}</p>
                <p className="text-xs text-muted-foreground">{t('habitsCompleted')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <ListTodo className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{displayTasksCompleted}</p>
                <p className="text-xs text-muted-foreground">{t('tasksCompleted')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/10 p-2">
                <Target className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{habits.length}</p>
                <p className="text-xs text-muted-foreground">{t('activeHabits')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-500/10 p-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalHabitCompletions}</p>
                <p className="text-xs text-muted-foreground">{t('totalCompletions')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Stats */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-5 w-5" />
              {t('last7Days')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('habitCompletions')}</span>
                <span className="font-medium">{habitCompletionsLast7}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5" />
              {t('last30Days')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('habitCompletions')}</span>
                <span className="font-medium">{habitCompletionsLast30}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('tasksOverview')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-3xl font-bold">{pendingTasks.length}</p>
              <p className="text-sm text-muted-foreground">{t('pending')}</p>
            </div>
            <div className="rounded-lg bg-green-500/10 p-4 text-center">
              <p className="text-3xl font-bold text-green-500">
                {completedTasks.length}
              </p>
              <p className="text-sm text-muted-foreground">{t('completed')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
