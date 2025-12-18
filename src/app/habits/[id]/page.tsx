'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { useHabitsStore } from '@/stores/habits'
import { useGamificationStore } from '@/stores/gamification'
import { HabitHeatmap, HabitFormDialog } from '@/components/habits'
import {
  ArrowLeft,
  Flame,
  Trophy,
  TrendingUp,
  Calendar,
  Trash2,
  Edit,
} from 'lucide-react'

interface HabitDetailPageProps {
  params: Promise<{ id: string }>
}

export default function HabitDetailPage({ params }: HabitDetailPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const t = useTranslations('habits')
  const tCommon = useTranslations('common')

  const habit = useHabitsStore((state) => state.getHabitById(id))
  const deleteHabit = useHabitsStore((state) => state.deleteHabit)
  const streak = useGamificationStore((state) => state.getStreakForHabit(id))

  if (!habit) {
    return (
      <div className="container mx-auto max-w-md p-4 lg:max-w-4xl lg:p-6">
        <p className="text-center text-muted-foreground">Hábito não encontrado</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    )
  }

  // Calculate stats
  const totalCompletions = habit.completions.length
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - i))
    return date.toISOString().split('T')[0]
  })
  const completionsLast30 = habit.completions.filter((c) =>
    last30Days.includes(c.date)
  ).length
  const completionRate30 = Math.round((completionsLast30 / 30) * 100)

  const handleDelete = () => {
    if (confirm('Tem certeza que deseja excluir este hábito?')) {
      deleteHabit(habit.id)
      router.push('/habits')
    }
  }

  return (
    <div className="container mx-auto max-w-md space-y-6 p-4 lg:max-w-4xl lg:p-6">
      {/* Header */}
      <header className="flex items-center gap-4">
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
            <p className="text-sm text-muted-foreground">{habit.description}</p>
          )}
        </div>
      </header>

      {/* Frequency Badge */}
      <div className="flex items-center gap-2">
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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-orange-500/10 p-2">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{streak?.currentStreak || 0}</p>
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
              <p className="text-2xl font-bold">{streak?.longestStreak || 0}</p>
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
              <p className="text-2xl font-bold">{completionRate30}%</p>
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
              <p className="text-2xl font-bold">{totalCompletions}</p>
              <p className="text-xs text-muted-foreground">Total completado</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress and Heatmap Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Progress this month */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Progresso este mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{completionsLast30} de 30 dias</span>
                <span className="font-medium">{completionRate30}%</span>
              </div>
              <Progress value={completionRate30} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Heatmap */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Histórico</CardTitle>
          </CardHeader>
          <CardContent>
            <HabitHeatmap habit={habit} />
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Separator />
      <div className="flex gap-2">
        <HabitFormDialog habit={habit}>
          <Button variant="outline" className="flex-1">
            <Edit className="mr-2 h-4 w-4" />
            {tCommon('edit')}
          </Button>
        </HabitFormDialog>
        <Button variant="destructive" className="flex-1" onClick={handleDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          {tCommon('delete')}
        </Button>
      </div>
    </div>
  )
}
