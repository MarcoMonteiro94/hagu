'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { PageTransition, CountUp } from '@/components/ui/motion'
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
import { AreaFormDialog } from '@/components/areas'
import { HabitFormDialog } from '@/components/habits'
import { useAreaBySlug, useDeleteArea } from '@/hooks/queries/use-areas'
import { useActiveHabits, useToggleCompletion } from '@/hooks/queries/use-habits'
import { useTasks, useUpdateTask } from '@/hooks/queries/use-tasks'
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Circle,
  Target,
  TrendingUp,
  Calendar,
  Heart,
  BookOpen,
  Wallet,
  Palette,
  Briefcase,
  Home,
  Users,
  Dumbbell,
  Music,
  Camera,
  Plane,
  Coffee,
  Gamepad2,
  Sparkles,
  Brain,
  ChevronRight,
} from 'lucide-react'
import { formatLocalDate } from '@/lib/utils'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  heart: Heart,
  book: BookOpen,
  wallet: Wallet,
  palette: Palette,
  briefcase: Briefcase,
  home: Home,
  users: Users,
  dumbbell: Dumbbell,
  music: Music,
  camera: Camera,
  plane: Plane,
  coffee: Coffee,
  gamepad: Gamepad2,
  sparkles: Sparkles,
  brain: Brain,
  target: Target,
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date.toISOString().split('T')[0]
  })
}

export default function AreaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const router = useRouter()
  const t = useTranslations('areas')
  const tCommon = useTranslations('common')
  const tHabits = useTranslations('habits')
  const tTasks = useTranslations('tasks')

  const [mounted, setMounted] = useState(false)

  const { data: area, isLoading: isLoadingArea } = useAreaBySlug(slug)
  const deleteAreaMutation = useDeleteArea()
  const { data: allHabits = [] } = useActiveHabits()
  const toggleCompletionMutation = useToggleCompletion()
  const { data: tasks = [] } = useTasks()
  const updateTaskMutation = useUpdateTask()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="container mx-auto max-w-md space-y-6 p-4 lg:max-w-4xl lg:p-6">
        <div className="h-10 w-40 animate-pulse rounded-lg bg-muted" />
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  if (!area) {
    return (
      <PageTransition className="container mx-auto max-w-md space-y-6 p-4 lg:max-w-4xl lg:p-6">
        <Button variant="ghost" onClick={() => router.push('/areas')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('title')}
        </Button>
        <div className="py-12 text-center">
          <p className="text-muted-foreground">{t('areaNotFound')}</p>
        </div>
      </PageTransition>
    )
  }

  const IconComponent = ICON_MAP[area.icon] || Palette

  // Filter habits and tasks for this area
  const areaHabits = allHabits.filter((h) => h.areaId === area.id)
  const areaTasks = tasks.filter((t) => t.areaId === area.id)
  const pendingTasks = areaTasks.filter((t) => t.status !== 'done')
  const completedTasks = areaTasks.filter((t) => t.status === 'done')

  const today = getTodayString()
  const last7Days = getLast7Days()

  // Calculate stats
  const habitsCompletedToday = areaHabits.filter((h) =>
    h.completions.some((c) => c.date === today)
  ).length

  const totalCompletionsLast7 = areaHabits.reduce((acc, habit) => {
    return (
      acc + habit.completions.filter((c) => last7Days.includes(c.date)).length
    )
  }, 0)

  const possibleCompletionsLast7 = areaHabits.length * 7
  const weeklyRate =
    possibleCompletionsLast7 > 0
      ? Math.round((totalCompletionsLast7 / possibleCompletionsLast7) * 100)
      : 0

  const handleDeleteArea = async () => {
    if (!area) return
    try {
      await deleteAreaMutation.mutateAsync(area.id)
      router.push('/areas')
    } catch (error) {
      console.error('Failed to delete area:', error)
    }
  }

  const handleToggleHabit = (habitId: string) => {
    toggleCompletionMutation.mutate({ habitId, date: today })
  }

  const handleToggleTask = (taskId: string) => {
    const task = areaTasks.find((t) => t.id === taskId)
    if (!task) return

    updateTaskMutation.mutate({
      id: taskId,
      updates: {
        status: task.status === 'done' ? 'pending' : 'done',
        completedAt: task.status === 'done' ? undefined : new Date().toISOString(),
      },
    })
  }

  return (
    <PageTransition className="container mx-auto max-w-md space-y-6 p-4 lg:max-w-4xl lg:p-6">
      {/* Header */}
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/areas')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${area.color}20`, color: area.color }}
        >
          <IconComponent className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold lg:text-2xl">{area.name}</h1>
          <p className="text-sm text-muted-foreground">
            {areaHabits.length} {tHabits('title').toLowerCase()} •{' '}
            {pendingTasks.length} {tTasks('title').toLowerCase()}
          </p>
        </div>
        <div className="flex gap-2">
          <AreaFormDialog area={area}>
            <Button variant="outline" size="icon">
              <Pencil className="h-4 w-4" />
            </Button>
          </AreaFormDialog>
          {!area.isDefault && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('deleteArea')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('deleteConfirmation')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteArea}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {tCommon('delete')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div
              className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${area.color}20`, color: area.color }}
            >
              <Target className="h-5 w-5" />
            </div>
            <CountUp
              to={habitsCompletedToday}
              className="text-2xl font-bold"
            />
            <span className="text-2xl font-bold text-muted-foreground">
              /{areaHabits.length}
            </span>
            <p className="text-xs text-muted-foreground">{t('todayProgress')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div
              className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${area.color}20`, color: area.color }}
            >
              <TrendingUp className="h-5 w-5" />
            </div>
            <CountUp to={weeklyRate} className="text-2xl font-bold" />
            <span className="text-2xl font-bold">%</span>
            <p className="text-xs text-muted-foreground">{t('weeklyRate')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div
              className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${area.color}20`, color: area.color }}
            >
              <Calendar className="h-5 w-5" />
            </div>
            <CountUp
              to={totalCompletionsLast7}
              className="text-2xl font-bold"
            />
            <p className="text-xs text-muted-foreground">{t('last7Days')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Habits Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">{tHabits('title')}</CardTitle>
          <HabitFormDialog defaultAreaId={area.id}>
            <Button variant="ghost" size="sm">
              <Plus className="mr-1 h-4 w-4" />
              {tHabits('addNew')}
            </Button>
          </HabitFormDialog>
        </CardHeader>
        <CardContent>
          {areaHabits.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-muted-foreground">{t('noHabits')}</p>
              <HabitFormDialog defaultAreaId={area.id}>
                <Button variant="outline" className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('createFirst')}
                </Button>
              </HabitFormDialog>
            </div>
          ) : (
            <div className="space-y-2">
              {areaHabits.map((habit) => {
                const isCompleted = habit.completions.some((c) => c.date === today)
                const completionRate =
                  habit.completions.length > 0
                    ? Math.round(
                        (habit.completions.filter((c) =>
                          last7Days.includes(c.date)
                        ).length /
                          7) *
                          100
                      )
                    : 0

                return (
                  <div
                    key={habit.id}
                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
                    style={{ borderLeftColor: habit.color, borderLeftWidth: 4 }}
                  >
                    <button
                      onClick={() => handleToggleHabit(habit.id)}
                      className="flex-shrink-0"
                    >
                      {isCompleted ? (
                        <CheckCircle2
                          className="h-6 w-6"
                          style={{ color: habit.color }}
                        />
                      ) : (
                        <Circle className="h-6 w-6 text-muted-foreground" />
                      )}
                    </button>
                    <Link
                      href={`/habits/${habit.id}`}
                      className="flex-1 min-w-0"
                    >
                      <p
                        className={`font-medium truncate ${
                          isCompleted ? 'line-through text-muted-foreground' : ''
                        }`}
                      >
                        {habit.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress
                          value={completionRate}
                          className="h-1.5 flex-1"
                          style={
                            {
                              '--progress-color': habit.color,
                            } as React.CSSProperties
                          }
                        />
                        <span className="text-xs text-muted-foreground">
                          {completionRate}%
                        </span>
                      </div>
                    </Link>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">{tTasks('title')}</CardTitle>
          <Link href="/tasks">
            <Button variant="ghost" size="sm">
              <Plus className="mr-1 h-4 w-4" />
              {tTasks('addNew')}
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {areaTasks.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-muted-foreground">{t('noTasks')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Pending Tasks */}
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <button onClick={() => handleToggleTask(task.id)}>
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{task.title}</p>
                    {task.dueDate && (
                      <p className="text-xs text-muted-foreground">
                        {formatLocalDate(task.dueDate, 'pt-BR')}
                      </p>
                    )}
                  </div>
                  {task.priority && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        task.priority === 'urgent'
                          ? 'bg-red-500/10 text-red-500'
                          : task.priority === 'high'
                            ? 'bg-orange-500/10 text-orange-500'
                            : task.priority === 'medium'
                              ? 'bg-yellow-500/10 text-yellow-500'
                              : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {task.priority}
                    </span>
                  )}
                </div>
              ))}

              {/* Completed Tasks */}
              {completedTasks.length > 0 && (
                <>
                  <div className="pt-2 text-xs font-medium text-muted-foreground">
                    {tCommon('completed')} ({completedTasks.length})
                  </div>
                  {completedTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 rounded-lg border p-3 opacity-60"
                    >
                      <button onClick={() => handleToggleTask(task.id)}>
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      </button>
                      <p className="flex-1 font-medium line-through truncate">
                        {task.title}
                      </p>
                    </div>
                  ))}
                  {completedTasks.length > 3 && (
                    <p className="text-center text-xs text-muted-foreground">
                      +{completedTasks.length - 3} {t('more')}
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </PageTransition>
  )
}
