'use client'

import { use, useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { PageTransition, CountUp } from '@/components/ui/motion'
import { useHabitsStore } from '@/stores/habits'
import { useGamificationStore } from '@/stores/gamification'
import { useSettingsStore } from '@/stores/settings'
import { HabitYearHeatmap, HabitFormDialog } from '@/components/habits'
import {
  ArrowLeft,
  Flame,
  Trophy,
  TrendingUp,
  Calendar,
  Trash2,
  Edit,
  CheckCircle2,
  Circle,
  Clock,
  BarChart3,
} from 'lucide-react'

interface HabitDetailPageProps {
  params: Promise<{ id: string }>
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

const DAY_NAMES_PT = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const DAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function HabitDetailPage({ params }: HabitDetailPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const t = useTranslations('habits')
  const tCommon = useTranslations('common')
  const [mounted, setMounted] = useState(false)

  const habit = useHabitsStore((state) => state.getHabitById(id))
  const deleteHabit = useHabitsStore((state) => state.deleteHabit)
  const toggleCompletion = useHabitsStore((state) => state.toggleCompletion)
  const streak = useGamificationStore((state) => state.getStreakForHabit(id))
  const updateStreak = useGamificationStore((state) => state.updateStreak)
  const incrementHabitsCompleted = useGamificationStore((state) => state.incrementHabitsCompleted)
  const locale = useSettingsStore((state) => state.locale)

  useEffect(() => {
    setMounted(true)
  }, [])

  const dayNames = locale === 'pt-BR' ? DAY_NAMES_PT : DAY_NAMES_EN

  // Calculate advanced statistics
  const stats = useMemo(() => {
    if (!habit) return null

    const today = getTodayString()
    const completions = habit.completions

    // Last 30 days
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      return date.toISOString().split('T')[0]
    })
    const completionsLast30 = completions.filter((c) => last30Days.includes(c.date)).length

    // Last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date.toISOString().split('T')[0]
    })
    const completionsLast7 = completions.filter((c) => last7Days.includes(c.date)).length

    // Best day of week
    const dayCount = [0, 0, 0, 0, 0, 0, 0]
    completions.forEach((c) => {
      const dayOfWeek = new Date(c.date + 'T00:00:00').getDay()
      dayCount[dayOfWeek]++
    })
    const bestDayIndex = dayCount.indexOf(Math.max(...dayCount))
    const bestDay = dayCount[bestDayIndex] > 0 ? dayNames[bestDayIndex] : null

    // Average per week (last 12 weeks)
    const last12Weeks = 12 * 7
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - last12Weeks)
    const completionsLast12Weeks = completions.filter(
      (c) => new Date(c.date) >= startDate
    ).length
    const avgPerWeek = Math.round((completionsLast12Weeks / 12) * 10) / 10

    // Is completed today
    const isCompletedToday = completions.some((c) => c.date === today)

    // Recent completions (last 10)
    const recentCompletions = [...completions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)

    // First completion date
    const firstCompletion = completions.length > 0
      ? completions.reduce((min, c) => (c.date < min ? c.date : min), completions[0].date)
      : null

    // Days since start
    const daysSinceStart = firstCompletion
      ? Math.floor((Date.now() - new Date(firstCompletion).getTime()) / (1000 * 60 * 60 * 24))
      : 0

    return {
      totalCompletions: completions.length,
      completionsLast30,
      completionsLast7,
      completionRate30: Math.round((completionsLast30 / 30) * 100),
      completionRate7: Math.round((completionsLast7 / 7) * 100),
      bestDay,
      avgPerWeek,
      isCompletedToday,
      recentCompletions,
      firstCompletion,
      daysSinceStart,
    }
  }, [habit, dayNames])

  if (!habit || !stats) {
    return (
      <PageTransition className="container mx-auto max-w-md p-4 lg:max-w-4xl lg:p-6">
        <p className="text-center text-muted-foreground">Hábito não encontrado</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </PageTransition>
    )
  }

  const handleToggleToday = () => {
    const today = getTodayString()
    const wasCompleted = stats.isCompletedToday

    toggleCompletion(habit.id, today)

    // Update gamification when completing (not uncompleting)
    if (!wasCompleted) {
      updateStreak(habit.id, today)
      incrementHabitsCompleted()
    }
  }

  const handleDelete = () => {
    deleteHabit(habit.id)
    router.push('/habits')
  }

  const displayStreak = mounted ? (streak?.currentStreak || 0) : 0
  const displayLongestStreak = mounted ? (streak?.longestStreak || 0) : 0

  return (
    <PageTransition className="container mx-auto max-w-md space-y-6 p-4 lg:max-w-4xl lg:p-6">
      {/* Header */}
      <header className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: habit.color }}
            />
            <h1 className="text-xl font-bold lg:text-2xl">{habit.title}</h1>
          </div>
          {habit.description && (
            <p className="mt-1 text-sm text-muted-foreground">{habit.description}</p>
          )}
        </div>

        {/* Today's toggle button */}
        <Button
          variant={stats.isCompletedToday ? 'default' : 'outline'}
          size="sm"
          onClick={handleToggleToday}
          className="gap-2"
        >
          {stats.isCompletedToday ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Feito
            </>
          ) : (
            <>
              <Circle className="h-4 w-4" />
              Marcar hoje
            </>
          )}
        </Button>
      </header>

      {/* Frequency and Tracking Badges */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">
          {habit.frequency.type === 'daily' && t('frequencyDaily')}
          {habit.frequency.type === 'weekly' &&
            `${habit.frequency.daysPerWeek}x por semana`}
          {habit.frequency.type === 'specificDays' &&
            `${habit.frequency.days.length} dias por semana`}
          {habit.frequency.type === 'monthly' &&
            `${habit.frequency.timesPerMonth}x por mês`}
        </Badge>
        {habit.tracking.type === 'quantitative' && (
          <Badge variant="outline">
            Meta: {habit.tracking.target} {habit.tracking.unit}
          </Badge>
        )}
        {stats.firstCompletion && (
          <Badge variant="outline" className="text-muted-foreground">
            <Clock className="mr-1 h-3 w-3" />
            {stats.daysSinceStart} dias de tracking
          </Badge>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-orange-500/10 p-2">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <CountUp to={displayStreak} duration={1} className="text-2xl font-bold" />
              <p className="text-xs text-muted-foreground">{t('currentStreak')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-yellow-500/10 p-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <CountUp to={displayLongestStreak} duration={1} className="text-2xl font-bold" />
              <p className="text-xs text-muted-foreground">{t('longestStreak')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-green-500/10 p-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <CountUp to={stats.completionRate30} duration={1} className="text-2xl font-bold" />
              <span className="text-2xl font-bold">%</span>
              <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Calendar className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CountUp to={stats.totalCompletions} duration={1.2} className="text-2xl font-bold" />
              <p className="text-xs text-muted-foreground">Total completado</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Year Heatmap */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-5 w-5" />
            Histórico do ano
          </CardTitle>
        </CardHeader>
        <CardContent>
          <HabitYearHeatmap habit={habit} weeks={52} />
        </CardContent>
      </Card>

      {/* Additional Stats */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Progress Cards */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Progresso recente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Últimos 7 dias</span>
                <span className="font-medium">{stats.completionsLast7}/7 ({stats.completionRate7}%)</span>
              </div>
              <Progress value={stats.completionRate7} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Últimos 30 dias</span>
                <span className="font-medium">{stats.completionsLast30}/30 ({stats.completionRate30}%)</span>
              </div>
              <Progress value={stats.completionRate30} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Insights */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {stats.bestDay && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Melhor dia da semana</span>
                  <span className="font-medium">{stats.bestDay}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Média por semana</span>
                <span className="font-medium">{stats.avgPerWeek}x</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Esta semana</span>
                <span className="font-medium">{stats.completionsLast7}x</span>
              </div>
              {stats.firstCompletion && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Primeiro registro</span>
                  <span className="font-medium">
                    {new Date(stats.firstCompletion + 'T00:00:00').toLocaleDateString(locale)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Completions */}
      {stats.recentCompletions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Conclusões recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentCompletions.map((completion) => {
                const date = new Date(completion.date + 'T00:00:00')
                const isToday = completion.date === getTodayString()
                const isYesterday =
                  completion.date ===
                  new Date(Date.now() - 86400000).toISOString().split('T')[0]

                return (
                  <div
                    key={completion.date}
                    className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2
                        className="h-4 w-4"
                        style={{ color: habit.color }}
                      />
                      <span className="text-sm">
                        {isToday
                          ? 'Hoje'
                          : isYesterday
                          ? 'Ontem'
                          : date.toLocaleDateString(locale, {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                            })}
                      </span>
                    </div>
                    {habit.tracking.type === 'quantitative' && (
                      <Badge variant="outline">
                        {completion.value} {habit.tracking.unit}
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Separator />
      <div className="flex gap-2">
        <HabitFormDialog habit={habit}>
          <Button variant="outline" className="flex-1">
            <Edit className="mr-2 h-4 w-4" />
            {tCommon('edit')}
          </Button>
        </HabitFormDialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="flex-1">
              <Trash2 className="mr-2 h-4 w-4" />
              {tCommon('delete')}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir hábito?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O hábito &quot;{habit.title}&quot; e todo
                seu histórico de {stats.totalCompletions} conclusões serão
                permanentemente excluídos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  )
}
