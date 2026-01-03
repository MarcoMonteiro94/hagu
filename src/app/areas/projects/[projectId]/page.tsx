'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageTransition } from '@/components/ui/motion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ProjectFormDialog } from '@/components/projects/project-form-dialog'
import { ObjectiveList } from '@/components/projects/objective-list'
import { MilestoneTimeline } from '@/components/projects/milestone-timeline'
import { MetricGrid } from '@/components/projects/metric-card'
import { HabitFormDialog } from '@/components/habits/habit-form-dialog'
import {
  useProjectWithProgress,
  useArchiveProject,
  useCompleteProject,
  usePauseProject,
  useResumeProject,
  useDeleteProject,
} from '@/hooks/queries/use-projects'
import { useTasksByProject } from '@/hooks/queries/use-tasks'
import { useHabitsByProject } from '@/hooks/queries/use-habits'
import type { ProjectStatus } from '@/types'
import { toast } from 'sonner'
import {
  ArrowLeft,
  MoreVertical,
  Rocket,
  Target,
  Flag,
  TrendingUp,
  CheckCircle2,
  Pause,
  Play,
  Archive,
  Trash2,
  Edit,
  Calendar,
  ListTodo,
  Repeat,
  BarChart3,
  Plus,
} from 'lucide-react'
import {
  Target as TargetIcon,
  Lightbulb,
  Code,
  Briefcase,
  GraduationCap,
  Heart,
  Star,
  Trophy,
  Compass,
  Zap,
} from 'lucide-react'

const ICON_MAP: Record<string, React.ElementType> = {
  rocket: Rocket,
  target: TargetIcon,
  lightbulb: Lightbulb,
  code: Code,
  briefcase: Briefcase,
  'graduation-cap': GraduationCap,
  heart: Heart,
  star: Star,
  flag: Flag,
  trophy: Trophy,
  compass: Compass,
  zap: Zap,
}

const STATUS_CONFIG: Record<
  ProjectStatus,
  { icon: React.ElementType; label: string; variant: 'default' | 'secondary' | 'outline' }
> = {
  active: { icon: Rocket, label: 'active', variant: 'default' },
  paused: { icon: Pause, label: 'paused', variant: 'secondary' },
  completed: { icon: CheckCircle2, label: 'completed', variant: 'outline' },
  archived: { icon: Archive, label: 'archived', variant: 'outline' },
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('projects')
  const tCommon = useTranslations('common')
  const projectId = params.projectId as string

  const [activeTab, setActiveTab] = useState('objectives')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const { data: project, isLoading } = useProjectWithProgress(projectId)
  const { data: tasks = [] } = useTasksByProject(projectId)
  const { data: habits = [] } = useHabitsByProject(projectId)

  const archiveMutation = useArchiveProject()
  const completeMutation = useCompleteProject()
  const pauseMutation = usePauseProject()
  const resumeMutation = useResumeProject()
  const deleteMutation = useDeleteProject()

  const handleArchive = async () => {
    try {
      await archiveMutation.mutateAsync(projectId)
      toast.success(t('projectArchived'))
    } catch {
      toast.error(t('projectArchiveError'))
    }
  }

  const handleComplete = async () => {
    try {
      await completeMutation.mutateAsync(projectId)
      toast.success(t('projectCompleted'))
    } catch {
      toast.error(t('projectCompleteError'))
    }
  }

  const handlePause = async () => {
    try {
      await pauseMutation.mutateAsync(projectId)
      toast.success(t('projectPaused'))
    } catch {
      toast.error(t('projectPauseError'))
    }
  }

  const handleResume = async () => {
    try {
      await resumeMutation.mutateAsync(projectId)
      toast.success(t('projectResumed'))
    } catch {
      toast.error(t('projectResumeError'))
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(projectId)
      toast.success(t('projectDeleted'))
      router.push('/areas/projects')
    } catch {
      toast.error(t('projectDeleteError'))
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl p-4 lg:p-6">
        <div className="animate-pulse space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-muted rounded-lg" />
            <div className="space-y-2 flex-1">
              <div className="h-6 w-48 bg-muted rounded" />
              <div className="h-4 w-32 bg-muted rounded" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-lg" />
            ))}
          </div>
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="container mx-auto max-w-4xl p-4 lg:p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Rocket className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">{t('projectNotFound')}</h3>
            <Button className="mt-4" onClick={() => router.push('/areas/projects')}>
              {t('backToProjects')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const IconComponent = project.icon ? ICON_MAP[project.icon] : Rocket
  const statusConfig = STATUS_CONFIG[project.status]
  const StatusIcon = statusConfig.icon

  const completedTasks = tasks.filter((t) => t.status === 'done').length
  const today = new Date().toISOString().split('T')[0]
  const daysUntilDue = project.dueDate
    ? Math.ceil(
        (new Date(project.dueDate + 'T00:00:00').getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null

  return (
    <PageTransition className="container mx-auto max-w-4xl space-y-6 p-4 lg:p-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${project.color}20` }}
          >
            {IconComponent && (
              <IconComponent className="h-6 w-6" style={{ color: project.color }} />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold truncate">{project.title}</h1>
              <Badge variant={statusConfig.variant} className="flex items-center gap-1">
                <StatusIcon className="h-3 w-3" />
                {t(`status.${statusConfig.label}`)}
              </Badge>
            </div>
            {project.description && (
              <p className="mt-1 text-muted-foreground">{project.description}</p>
            )}
            {project.dueDate && (
              <div
                className={`mt-2 flex items-center gap-1 text-sm ${
                  daysUntilDue !== null && daysUntilDue < 0
                    ? 'text-destructive'
                    : 'text-muted-foreground'
                }`}
              >
                <Calendar className="h-4 w-4" />
                {daysUntilDue !== null && daysUntilDue < 0
                  ? t('overdue')
                  : daysUntilDue === 0
                    ? t('dueToday')
                    : t('dueIn', { days: daysUntilDue ?? 0 })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <ProjectFormDialog project={project}>
            <Button variant="outline" size="sm">
              <Edit className="mr-1 h-4 w-4" />
              {tCommon('edit')}
            </Button>
          </ProjectFormDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {project.status === 'active' && (
                <>
                  <DropdownMenuItem onClick={handlePause}>
                    <Pause className="mr-2 h-4 w-4" />
                    {t('pause')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleComplete}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {t('markComplete')}
                  </DropdownMenuItem>
                </>
              )}
              {project.status === 'paused' && (
                <DropdownMenuItem onClick={handleResume}>
                  <Play className="mr-2 h-4 w-4" />
                  {t('resume')}
                </DropdownMenuItem>
              )}
              {project.status !== 'archived' && (
                <DropdownMenuItem onClick={handleArchive}>
                  <Archive className="mr-2 h-4 w-4" />
                  {t('archive')}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {tCommon('delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('progress')}</span>
            </div>
            <div className="mt-1">
              <span className="text-2xl font-bold">{project.progress}%</span>
              <Progress value={project.progress} className="mt-1 h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('objectives')}</span>
            </div>
            <div className="mt-1">
              <span className="text-2xl font-bold">
                {project.completedObjectivesCount}/{project.objectivesCount}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('tasks')}</span>
            </div>
            <div className="mt-1">
              <span className="text-2xl font-bold">
                {completedTasks}/{tasks.length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('habits')}</span>
            </div>
            <div className="mt-1">
              <span className="text-2xl font-bold">{habits.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="objectives" className="gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">{t('objectives')}</span>
          </TabsTrigger>
          <TabsTrigger value="milestones" className="gap-2">
            <Flag className="h-4 w-4" />
            <span className="hidden sm:inline">{t('milestones')}</span>
          </TabsTrigger>
          <TabsTrigger value="metrics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">{t('metrics')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="objectives" className="mt-6">
          <ObjectiveList projectId={projectId} color={project.color} />
        </TabsContent>

        <TabsContent value="milestones" className="mt-6">
          <MilestoneTimeline projectId={projectId} color={project.color} />
        </TabsContent>

        <TabsContent value="metrics" className="mt-6">
          <MetricGrid projectId={projectId} color={project.color} />
        </TabsContent>
      </Tabs>

      {/* Related Items */}
      {(tasks.length > 0 || habits.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Tasks */}
          {tasks.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ListTodo className="h-4 w-4" />
                  {t('linkedTasks')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 rounded-lg border p-2"
                    >
                      <CheckCircle2
                        className={`h-4 w-4 ${
                          task.status === 'done'
                            ? 'text-green-500'
                            : 'text-muted-foreground'
                        }`}
                      />
                      <span
                        className={`flex-1 truncate text-sm ${
                          task.status === 'done' ? 'line-through text-muted-foreground' : ''
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>
                  ))}
                  {tasks.length > 5 && (
                    <Button
                      variant="ghost"
                      className="w-full text-sm"
                      onClick={() => router.push(`/tasks?project=${projectId}`)}
                    >
                      {t('viewAllTasks', { count: tasks.length })}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Habits */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Repeat className="h-4 w-4" />
                  {t('linkedHabits')}
                </CardTitle>
                <HabitFormDialog defaultProjectId={projectId}>
                  <Button variant="outline" size="sm">
                    <Plus className="mr-1 h-4 w-4" />
                    {t('addHabit')}
                  </Button>
                </HabitFormDialog>
              </div>
            </CardHeader>
            <CardContent>
              {habits.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground text-sm">
                  {t('noLinkedHabits')}
                </div>
              ) : (
                <div className="space-y-2">
                  {habits.slice(0, 5).map((habit) => {
                    const todayCompletion = habit.completions.find((c) => c.date === today)
                    const isCompleted = !!todayCompletion

                    return (
                      <div
                        key={habit.id}
                        className="flex items-center gap-2 rounded-lg border p-2"
                        style={{ borderLeftColor: habit.color, borderLeftWidth: 3 }}
                      >
                        <span
                          className={`flex-1 truncate text-sm ${
                            isCompleted ? 'text-muted-foreground' : ''
                          }`}
                        >
                          {habit.title}
                        </span>
                        {isCompleted && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    )
                  })}
                  {habits.length > 5 && (
                    <Button
                      variant="ghost"
                      className="w-full text-sm"
                      onClick={() => router.push(`/habits?project=${projectId}`)}
                    >
                      {t('viewAllHabits', { count: habits.length })}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteConfirmDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  )
}
