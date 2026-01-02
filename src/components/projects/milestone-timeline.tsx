'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  useMilestonesByProject,
  useCreateMilestone,
  useUpdateMilestone,
  useDeleteMilestone,
  useCompleteMilestone,
} from '@/hooks/queries/use-projects'
import type { Milestone, MilestoneStatus } from '@/types'
import { Plus, Flag, Check, Clock, AlertTriangle, Calendar, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ptBR, enUS } from 'date-fns/locale'

const STATUS_CONFIG: Record<MilestoneStatus, { icon: React.ElementType; className: string }> = {
  upcoming: { icon: Clock, className: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' },
  in_progress: { icon: Clock, className: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30' },
  completed: { icon: Check, className: 'bg-green-100 text-green-600 dark:bg-green-900/30' },
  missed: { icon: AlertTriangle, className: 'bg-red-100 text-red-600 dark:bg-red-900/30' },
}

interface MilestoneItemProps {
  milestone: Milestone
  projectId: string
  color?: string
  onComplete: (id: string) => void
  onDelete: (id: string) => void
}

function MilestoneItem({ milestone, projectId, color, onComplete, onDelete }: MilestoneItemProps) {
  const t = useTranslations('projects')
  const locale = useLocale()
  const dateLocale = locale === 'pt-BR' ? ptBR : enUS

  const config = STATUS_CONFIG[milestone.status]
  const StatusIcon = config.icon
  const isCompleted = milestone.status === 'completed'
  const isMissed = milestone.status === 'missed'

  const targetDate = new Date(milestone.targetDate + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isPast = targetDate < today && !isCompleted
  const isToday = targetDate.toDateString() === today.toDateString()

  const formatDate = (): string => {
    if (isToday) return t('today')
    if (isPast) return formatDistanceToNow(targetDate, { addSuffix: true, locale: dateLocale })
    return targetDate.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      year: targetDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    })
  }

  return (
    <div className="group relative flex gap-4">
      {/* Timeline line */}
      <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-border group-last:hidden" />

      {/* Timeline dot */}
      <div
        className={cn(
          'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          config.className
        )}
        style={isCompleted ? { backgroundColor: `${color}20`, color } : undefined}
      >
        <StatusIcon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h4 className={cn('font-medium', isCompleted && 'line-through opacity-60')}>
              {milestone.title}
            </h4>
            {milestone.description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{milestone.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-sm',
                isPast && !isCompleted ? 'text-destructive font-medium' : 'text-muted-foreground'
              )}
            >
              {formatDate()}
            </span>
            {!isCompleted && !isMissed && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onComplete(milestone.id)}>
                <Check className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100"
              onClick={() => onDelete(milestone.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface MilestoneTimelineProps {
  projectId: string
  color?: string
}

export function MilestoneTimeline({ projectId, color }: MilestoneTimelineProps) {
  const t = useTranslations('projects')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetDate, setTargetDate] = useState('')

  const { data: milestones = [], isLoading } = useMilestonesByProject(projectId)
  const createMilestoneMutation = useCreateMilestone()
  const completeMilestoneMutation = useCompleteMilestone()
  const deleteMilestoneMutation = useDeleteMilestone()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !targetDate) return

    try {
      await createMilestoneMutation.mutateAsync({
        projectId,
        title: title.trim(),
        description: description.trim() || undefined,
        targetDate,
      })
      setTitle('')
      setDescription('')
      setTargetDate('')
      setDialogOpen(false)
      toast.success(t('milestoneCreated'))
    } catch (error) {
      toast.error(t('milestoneCreateError'))
    }
  }

  const handleComplete = async (id: string) => {
    try {
      await completeMilestoneMutation.mutateAsync({ id, projectId })
      toast.success(t('milestoneCompleted'))
    } catch (error) {
      toast.error(t('milestoneUpdateError'))
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMilestoneMutation.mutateAsync({ id, projectId })
      toast.success(t('milestoneDeleted'))
    } catch (error) {
      toast.error(t('milestoneDeleteError'))
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="h-8 w-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded bg-muted" />
              <div className="h-3 w-1/4 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Sort milestones by date
  const sortedMilestones = [...milestones].sort(
    (a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{t('milestones')}</h3>
          {milestones.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {milestones.filter((m) => m.status === 'completed').length}/{milestones.length}{' '}
              {t('completed')}
            </p>
          )}
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="mr-1 h-4 w-4" />
              {t('addMilestone')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('addMilestone')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="milestone-title">{t('milestoneName')}</Label>
                <Input
                  id="milestone-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('milestonePlaceholder')}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="milestone-description">{t('milestoneDescription')}</Label>
                <Input
                  id="milestone-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('milestoneDescriptionPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="milestone-date" className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {t('targetDate')}
                </Label>
                <Input
                  id="milestone-date"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button type="submit" disabled={createMilestoneMutation.isPending}>
                  {t('create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {milestones.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
          <Flag className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p>{t('noMilestones')}</p>
          <Button variant="link" className="mt-2" onClick={() => setDialogOpen(true)}>
            {t('addFirstMilestone')}
          </Button>
        </div>
      ) : (
        <div className="pl-4">
          {sortedMilestones.map((milestone) => (
            <MilestoneItem
              key={milestone.id}
              milestone={milestone}
              projectId={projectId}
              color={color}
              onComplete={handleComplete}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
