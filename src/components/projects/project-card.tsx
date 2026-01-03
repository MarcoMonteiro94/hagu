'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import type { ProjectWithProgress, ProjectStatus } from '@/types'
import {
  Rocket,
  Target,
  Lightbulb,
  Code,
  Briefcase,
  GraduationCap,
  Heart,
  Star,
  Flag,
  Trophy,
  Compass,
  Zap,
  Calendar,
  CheckCircle2,
  ListTodo,
  Repeat,
  Pause,
  Archive,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR, enUS } from 'date-fns/locale'
import { useLocale } from 'next-intl'

const ICON_MAP: Record<string, React.ElementType> = {
  rocket: Rocket,
  target: Target,
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

const STATUS_ICONS: Record<ProjectStatus, React.ElementType> = {
  active: Rocket,
  paused: Pause,
  completed: CheckCircle2,
  archived: Archive,
}

interface ProjectCardProps {
  project: ProjectWithProgress
  onClick?: () => void
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const t = useTranslations('projects')
  const locale = useLocale()
  const dateLocale = locale === 'pt-BR' ? ptBR : enUS

  const IconComponent = project.icon ? ICON_MAP[project.icon] : Rocket
  const StatusIcon = STATUS_ICONS[project.status]

  const formatDueDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return t('overdue')
    }
    if (diffDays === 0) {
      return t('dueToday')
    }
    if (diffDays <= 7) {
      return formatDistanceToNow(date, { addSuffix: true, locale: dateLocale })
    }
    return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
  }

  const isOverdue = project.dueDate && new Date(project.dueDate + 'T00:00:00') < new Date()

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]"
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${project.color}20` }}
            >
              {IconComponent && (
                <IconComponent className="h-5 w-5" style={{ color: project.color }} />
              )}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base line-clamp-2">{project.title}</CardTitle>
              {project.description && (
                <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                  {project.description}
                </p>
              )}
            </div>
          </div>
          <Badge
            variant={project.status === 'active' ? 'default' : 'secondary'}
            className="flex items-center gap-1"
          >
            <StatusIcon className="h-3 w-3" />
            {t(`status.${project.status}`)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('progress')}</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" style={{ accentColor: project.color }} />
          <p className="text-xs text-muted-foreground">
            {project.completedObjectivesCount} / {project.objectivesCount} {t('objectives')}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1" title={t('tasks')}>
            <ListTodo className="h-4 w-4" />
            <span>
              {project.completedTasksCount}/{project.tasksCount}
            </span>
          </div>
          {project.habitsCount > 0 && (
            <div className="flex items-center gap-1" title={t('habits')}>
              <Repeat className="h-4 w-4" />
              <span>{project.habitsCount}</span>
            </div>
          )}
          {project.dueDate && (
            <div
              className={`flex items-center gap-1 ${isOverdue ? 'text-destructive' : ''}`}
              title={t('dueDate')}
            >
              <Calendar className="h-4 w-4" />
              <span>{formatDueDate(project.dueDate)}</span>
            </div>
          )}
        </div>

        {/* Upcoming Milestones */}
        {project.upcomingMilestones.length > 0 && (
          <div className="border-t pt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              {t('upcomingMilestones')}
            </p>
            <div className="space-y-1">
              {project.upcomingMilestones.slice(0, 2).map((milestone) => (
                <div key={milestone.id} className="flex items-center gap-2 text-sm">
                  <Flag className="h-3 w-3" style={{ color: project.color }} />
                  <span className="flex-1 truncate">{milestone.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(milestone.targetDate).toLocaleDateString(locale, {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
