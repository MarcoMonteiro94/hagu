'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useTasksByProject, useUpdateTask } from '@/hooks/queries/use-tasks'
import type { Task } from '@/types'
import { Link2, Circle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface LinkTasksDialogProps {
  projectId: string
  objectiveId: string
  objectiveTitle: string
  children?: React.ReactNode
}

export function LinkTasksDialog({
  projectId,
  objectiveId,
  objectiveTitle,
  children,
}: LinkTasksDialogProps) {
  const t = useTranslations('projects')
  const tCommon = useTranslations('common')
  const [open, setOpen] = useState(false)
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())

  const { data: projectTasks = [] } = useTasksByProject(projectId)
  const updateTaskMutation = useUpdateTask()

  // Filter tasks that are not linked to any objective or linked to a different objective
  const availableTasks = useMemo(() => {
    return projectTasks.filter((task) => !task.objectiveId || task.objectiveId !== objectiveId)
  }, [projectTasks, objectiveId])

  const unlinkedTasks = availableTasks.filter((task) => !task.objectiveId)
  const otherObjectiveTasks = availableTasks.filter(
    (task) => task.objectiveId && task.objectiveId !== objectiveId
  )

  const handleToggleTask = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(taskId)) {
        newSet.delete(taskId)
      } else {
        newSet.add(taskId)
      }
      return newSet
    })
  }

  const handleLink = async () => {
    if (selectedTaskIds.size === 0) return

    try {
      // Update each selected task to link it to this objective
      await Promise.all(
        Array.from(selectedTaskIds).map((taskId) =>
          updateTaskMutation.mutateAsync({
            id: taskId,
            updates: { objectiveId },
          })
        )
      )

      toast.success(t('tasksLinked', { count: selectedTaskIds.size }))
      setSelectedTaskIds(new Set())
      setOpen(false)
    } catch (error) {
      console.error('Failed to link tasks:', error)
      toast.error(t('tasksLinkError'))
    }
  }

  const renderTaskItem = (task: Task) => {
    const isSelected = selectedTaskIds.has(task.id)
    const isCompleted = task.status === 'done'

    return (
      <div
        key={task.id}
        className={cn(
          'flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors',
          isSelected && 'bg-muted'
        )}
        onClick={() => handleToggleTask(task.id)}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => handleToggleTask(task.id)}
        />
        {isCompleted ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground" />
        )}
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm truncate', isCompleted && 'line-through text-muted-foreground')}>
            {task.title}
          </p>
          {task.dueDate && (
            <p className="text-xs text-muted-foreground">
              {new Date(task.dueDate).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Link2 className="mr-2 h-4 w-4" />
            {t('linkTasks')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('linkTasksTo', { objective: objectiveTitle })}</DialogTitle>
        </DialogHeader>

        {availableTasks.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>{t('noTasksToLink')}</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[300px] pr-4">
            <div className="space-y-4">
              {unlinkedTasks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {t('unlinkedTasks')}
                  </h4>
                  {unlinkedTasks.map(renderTaskItem)}
                </div>
              )}

              {otherObjectiveTasks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {t('tasksFromOtherObjectives')}
                  </h4>
                  {otherObjectiveTasks.map(renderTaskItem)}
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)}>
            {tCommon('cancel')}
          </Button>
          <Button
            onClick={handleLink}
            disabled={selectedTaskIds.size === 0 || updateTaskMutation.isPending}
          >
            {updateTaskMutation.isPending
              ? tCommon('saving')
              : t('linkSelected', { count: selectedTaskIds.size })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
