'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { GripVertical, Calendar, Clock, Repeat, MoreVertical, Trash2, Pencil } from 'lucide-react'
import { formatLocalDate } from '@/lib/utils'
import { TaskFormDialog } from './task-form-dialog'
import type { Task } from '@/types'

interface SortableTaskCardProps {
  task: Task
  onToggle: (taskId: string, currentStatus: string) => void
  onDelete?: (taskId: string) => void
  onEdit?: (task: Task) => void
  selectionMode?: boolean
  selected?: boolean
  onSelect?: (taskId: string, selected: boolean) => void
  isToggling?: boolean
  showDragHandle?: boolean
}

const priorityColors = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
}

const priorityLabels = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
}

export function SortableTaskCard({
  task,
  onToggle,
  onDelete,
  selectionMode = false,
  selected = false,
  onSelect,
  isToggling = false,
  showDragHandle = false,
}: SortableTaskCardProps) {
  const t = useTranslations('tasks')
  const tCommon = useTranslations('common')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isCompleted = task.status === 'done'
  const subtasksDone = task.subtasks.filter((s) => s.done).length
  const hasSubtasks = task.subtasks.length > 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'z-50 opacity-90' : ''}`}
    >
      <Card
        className={`transition-all ${
          isDragging ? 'scale-105 shadow-lg ring-2 ring-primary' : 'hover:bg-accent/50'
        } ${isCompleted ? 'opacity-60' : ''}`}
      >
        <CardContent className="flex items-center gap-3 p-3">
          {selectionMode && (
            <Checkbox
              checked={selected}
              onCheckedChange={(checked) => onSelect?.(task.id, checked === true)}
              className="h-5 w-5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
          )}

          {!selectionMode && showDragHandle && (
            <button
              className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-5 w-5" />
            </button>
          )}

          <Checkbox
            checked={isCompleted}
            onCheckedChange={() => onToggle(task.id, task.status)}
            disabled={isToggling}
            className="h-5 w-5"
          />

          <div className="flex-1 space-y-1">
            <p className={isCompleted ? 'line-through text-muted-foreground' : ''}>
              {task.title}
            </p>

            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {task.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {task.dueDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatLocalDate(task.dueDate, 'pt-BR')}
                </span>
              )}

              {task.estimatedMinutes && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {task.estimatedMinutes}min
                </span>
              )}

              {task.recurrence && (
                <span className="flex items-center gap-1 text-primary">
                  <Repeat className="h-3 w-3" />
                </span>
              )}

              {hasSubtasks && (
                <span>
                  {subtasksDone}/{task.subtasks.length} subtarefas
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {task.priority && (
              <Badge variant="outline" className="h-6 px-1.5 text-xs sm:px-2">
                <div className={`h-2 w-2 rounded-full ${priorityColors[task.priority]} sm:mr-1`} />
                <span className="hidden sm:inline">{priorityLabels[task.priority]}</span>
              </Badge>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  aria-label="Mais opções"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {t('editTask')}
                </DropdownMenuItem>
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(task.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {tCommon('delete')}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <TaskFormDialog
        task={task}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </div>
  )
}
