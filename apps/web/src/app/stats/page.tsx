'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PageTransition, CountUp } from '@/components/ui/motion'
import {
  WeeklyActivityChart,
  MonthlyProgressChart,
  TaskDistributionChart,
} from '@/components/charts'
import { useActiveHabits } from '@/hooks/queries/use-habits'
import { useTasks } from '@/hooks/queries/use-tasks'
import { useUserStats, useXpProgress } from '@/hooks/queries/use-gamification'
import { getXpForNextLevel } from '@/services/gamification.service'
import {
  Flame,
  Star,
  Trophy,
  CheckCircle2,
  ListTodo,
  TrendingUp,
  Calendar,
  Target,
  BarChart3,
  PieChart,
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
  const { data: habits = [] } = useActiveHabits()
  const { data: tasks = [] } = useTasks()
  const { data: stats } = useUserStats()
  const xpProgress = useXpProgress()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Use default values during SSR to prevent hydration mismatch
  const displayStreak = mounted ? (stats?.currentStreak ?? 0) : 0
  const displayLevel = mounted ? (stats?.level ?? 1) : 1
  const displayTotalXp = mounted ? (stats?.totalXp ?? 0) : 0
  const displayHabitsCompleted = mounted ? (stats?.habitsCompleted ?? 0) : 0
  const displayTasksCompleted = mounted ? (stats?.tasksCompleted ?? 0) : 0
  const displayXpProgress = mounted ? xpProgress.percentage : 0
  const displayXpForNext = mounted ? getXpForNextLevel(stats?.level ?? 1) : 100

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
    <PageTransition className="container mx-auto max-w-md space-y-6 p-4 lg:max-w-4xl lg:p-6">
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
                  <CountUp to={displayTotalXp} duration={1.5} className="font-medium" /> XP {t('total')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="h-6 w-6 text-orange-500" />
              <CountUp to={displayStreak} duration={1} className="text-2xl font-bold" />
              <span className="text-sm text-muted-foreground">{t('days')}</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm">
              <span>{t('progressToNextLevel')}</span>
              <span><CountUp to={displayXpProgress} duration={1} />%</span>
            </div>
            <Progress value={displayXpProgress} className="mt-2 h-3" />
            <p className="mt-1 text-xs text-muted-foreground">
              <CountUp to={displayXpForNext} duration={1} /> XP {t('forNextLevel')}
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
                <CountUp to={displayHabitsCompleted} duration={1.2} className="text-2xl font-bold" />
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
                <CountUp to={displayTasksCompleted} duration={1.2} className="text-2xl font-bold" />
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
                <CountUp to={habits.length} duration={1.2} className="text-2xl font-bold" />
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
                <CountUp to={totalHabitCompletions} duration={1.2} className="text-2xl font-bold" />
                <p className="text-xs text-muted-foreground">{t('totalCompletions')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Weekly Activity Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5" />
              {t('weeklyActivity')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mounted && <WeeklyActivityChart height={180} />}
            <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
              <span>{t('habitCompletions')}</span>
              <CountUp to={habitCompletionsLast7} duration={1} className="font-medium text-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Monthly Progress Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5" />
              {t('monthlyTrend')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mounted && <MonthlyProgressChart height={180} />}
            <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
              <span>{t('last30Days')}</span>
              <CountUp to={habitCompletionsLast30} duration={1} className="font-medium text-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <PieChart className="h-5 w-5" />
            {t('taskDistribution')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {mounted && <TaskDistributionChart height={200} />}
            <div className="flex flex-col justify-center gap-4">
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <CountUp to={pendingTasks.length} duration={1} className="text-3xl font-bold" />
                <p className="text-sm text-muted-foreground">{t('pending')}</p>
              </div>
              <div className="rounded-lg bg-green-500/10 p-4 text-center">
                <CountUp to={completedTasks.length} duration={1} className="text-3xl font-bold text-green-500" />
                <p className="text-sm text-muted-foreground">{t('completed')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageTransition>
  )
}
