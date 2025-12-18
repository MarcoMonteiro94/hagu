'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { GripVertical, Calendar, Clock } from 'lucide-react'
import type { Task } from '@/types'

interface SortableTaskCardProps {
  task: Task
  onToggle: (taskId: string, currentStatus: string) => void
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

export function SortableTaskCard({ task, onToggle }: SortableTaskCardProps) {
  const t = useTranslations('tasks')

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
          <button
            className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </button>

          <Checkbox
            checked={isCompleted}
            onCheckedChange={() => onToggle(task.id, task.status)}
            className="h-5 w-5"
          />

          <div className="flex-1 space-y-1">
            <p className={isCompleted ? 'line-through text-muted-foreground' : ''}>
              {task.title}
            </p>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {task.dueDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                </span>
              )}

              {task.estimatedMinutes && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {task.estimatedMinutes}min
                </span>
              )}

              {hasSubtasks && (
                <span>
                  {subtasksDone}/{task.subtasks.length} subtarefas
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {task.priority && (
              <Badge variant="outline" className="text-xs">
                <div className={`mr-1 h-2 w-2 rounded-full ${priorityColors[task.priority]}`} />
                {priorityLabels[task.priority]}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
