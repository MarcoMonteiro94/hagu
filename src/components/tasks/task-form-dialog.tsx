'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTasksStore } from '@/stores/tasks'
import { useOrderedAreas } from '@/stores/areas'
import type { TaskPriority, RecurrencePattern } from '@/types'
import { Plus, Flag, Calendar, FolderOpen, Clock, Repeat } from 'lucide-react'

type RecurrenceType = RecurrencePattern['type'] | 'none'

interface TaskFormDialogProps {
  children?: React.ReactNode
  defaultAreaId?: string
  defaultDueDate?: string
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'text-green-500',
  medium: 'text-yellow-500',
  high: 'text-orange-500',
  urgent: 'text-red-500',
}

export function TaskFormDialog({
  children,
  defaultAreaId,
  defaultDueDate,
}: TaskFormDialogProps) {
  const t = useTranslations('tasks')
  const tCommon = useTranslations('common')

  const addTask = useTasksStore((state) => state.addTask)
  const projects = useTasksStore((state) => state.projects)
  const areas = useOrderedAreas()

  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState(defaultDueDate || '')
  const [priority, setPriority] = useState<TaskPriority | ''>('')
  const [areaId, setAreaId] = useState(defaultAreaId || '')
  const [projectId, setProjectId] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState('')
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('none')
  const [recurrenceInterval, setRecurrenceInterval] = useState('1')
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('')

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setDueDate(defaultDueDate || '')
    setPriority('')
    setAreaId(defaultAreaId || '')
    setProjectId('')
    setEstimatedMinutes('')
    setRecurrenceType('none')
    setRecurrenceInterval('1')
    setRecurrenceEndDate('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return

    const recurrence: RecurrencePattern | undefined =
      recurrenceType !== 'none'
        ? {
            type: recurrenceType,
            interval: parseInt(recurrenceInterval) || 1,
            endDate: recurrenceEndDate || undefined,
          }
        : undefined

    addTask({
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate || undefined,
      priority: priority || undefined,
      areaId: areaId || undefined,
      projectId: projectId || undefined,
      estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : undefined,
      recurrence,
      status: 'pending',
      tags: [],
    })

    resetForm()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            {t('addNew')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('addNew')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">{t('taskName')} *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Revisar relatório mensal"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t('taskDescription')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes adicionais..."
              rows={2}
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t('dueDate')}
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={getTodayString()}
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Flag className="h-4 w-4" />
              {t('priority')}
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((p) => (
                <Button
                  key={p}
                  type="button"
                  variant={priority === p ? 'default' : 'outline'}
                  className="flex-col gap-1 h-auto py-2"
                  onClick={() => setPriority(priority === p ? '' : p)}
                >
                  <Flag className={`h-4 w-4 ${PRIORITY_COLORS[p]}`} />
                  <span className="text-xs">{t(`priority${p.charAt(0).toUpperCase() + p.slice(1)}`)}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Area */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Área de vida
            </Label>
            <Select value={areaId} onValueChange={setAreaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma área (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhuma</SelectItem>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: area.color }}
                      />
                      {area.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Project */}
          {projects.length > 0 && (
            <div className="space-y-2">
              <Label>{t('project')}</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um projeto (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {projects
                    .filter((p) => !p.archivedAt)
                    .map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Estimated Time */}
          <div className="space-y-2">
            <Label htmlFor="estimatedTime" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('estimatedTime')}
            </Label>
            <div className="flex gap-2">
              {[15, 30, 60, 120].map((mins) => (
                <Button
                  key={mins}
                  type="button"
                  variant={estimatedMinutes === String(mins) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    setEstimatedMinutes(
                      estimatedMinutes === String(mins) ? '' : String(mins)
                    )
                  }
                >
                  {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                </Button>
              ))}
              <Input
                id="estimatedTime"
                type="number"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                placeholder="min"
                className="w-20"
                min={1}
              />
            </div>
          </div>

          {/* Recurrence */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Repeat className="h-4 w-4" />
              {t('recurrence')}
            </Label>
            <Select
              value={recurrenceType}
              onValueChange={(value) => setRecurrenceType(value as RecurrenceType)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('recurrenceNone')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('recurrenceNone')}</SelectItem>
                <SelectItem value="daily">{t('recurrenceDaily')}</SelectItem>
                <SelectItem value="weekly">{t('recurrenceWeekly')}</SelectItem>
                <SelectItem value="monthly">{t('recurrenceMonthly')}</SelectItem>
              </SelectContent>
            </Select>

            {recurrenceType !== 'none' && (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {t('recurrenceInterval')}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={recurrenceInterval}
                      onChange={(e) => setRecurrenceInterval(e.target.value)}
                      className="w-16"
                      min={1}
                      max={99}
                    />
                    <span className="text-sm text-muted-foreground">
                      {recurrenceType === 'daily' &&
                        t('recurrenceIntervalDays', { count: parseInt(recurrenceInterval) || 1 })}
                      {recurrenceType === 'weekly' &&
                        t('recurrenceIntervalWeeks', { count: parseInt(recurrenceInterval) || 1 })}
                      {recurrenceType === 'monthly' &&
                        t('recurrenceIntervalMonths', { count: parseInt(recurrenceInterval) || 1 })}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {t('recurrenceEndDate')}
                  </Label>
                  <Input
                    type="date"
                    value={recurrenceEndDate}
                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                    min={dueDate || getTodayString()}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                resetForm()
                setOpen(false)
              }}
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" className="flex-1" disabled={!title.trim()}>
              {tCommon('create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
