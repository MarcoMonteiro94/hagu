'use client'

import { useTranslations } from 'next-intl'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTasks, useSetTaskStatus, useReorderTasks } from '@/hooks/queries/use-tasks'
import { arrayMove } from '@dnd-kit/sortable'
import { useOrderedAreas } from '@/hooks/queries/use-areas'
import {
  Circle,
  Clock,
  CheckCircle2,
  GripVertical,
  Calendar,
  Flag,
  Plus,
  Repeat,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatLocalDate } from '@/lib/utils'
import { TaskFormDialog } from './task-form-dialog'
import type { Task, TaskStatus } from '@/types'
import { STATUS_COLORS, PRIORITY_COLORS } from '@/config/colors'

interface KanbanColumn {
  id: TaskStatus
  titleKey: string
  icon: React.ReactNode
  color: string
}

const COLUMNS: KanbanColumn[] = [
  {
    id: 'pending',
    titleKey: 'statusPending',
    icon: <Circle className="h-4 w-4" />,
    color: STATUS_COLORS.pending.hex,
  },
  {
    id: 'in_progress',
    titleKey: 'statusInProgress',
    icon: <Clock className="h-4 w-4" />,
    color: STATUS_COLORS.in_progress.hex,
  },
  {
    id: 'done',
    titleKey: 'statusDone',
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: STATUS_COLORS.done.hex,
  },
]

interface KanbanTaskCardProps {
  task: Task
  isDragging?: boolean
}

function KanbanTaskCard({ task, isDragging }: KanbanTaskCardProps) {
  const { data: areas = [] } = useOrderedAreas()
  const area = areas.find((a) => a.id === task.areaId)

  const subtasksDone = task.subtasks.filter((s) => s.done).length
  const hasSubtasks = task.subtasks.length > 0

  return (
    <div
      className={`rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="space-y-2">
        {/* Title */}
        <p
          className={`font-medium leading-tight ${
            task.status === 'done' ? 'text-muted-foreground line-through' : ''
          }`}
        >
          {task.title}
        </p>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Priority */}
          {task.priority && (
            <div
              className="flex items-center gap-1 rounded px-1.5 py-0.5"
              style={{
                backgroundColor: `${PRIORITY_COLORS[task.priority].hex}15`,
                color: PRIORITY_COLORS[task.priority].hex,
              }}
            >
              <Flag className="h-3 w-3" />
              <span className="sr-only">Prioridade:</span>
              <span className="capitalize">{task.priority}</span>
            </div>
          )}

          {/* Due date */}
          {task.dueDate && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>
                {formatLocalDate(task.dueDate, 'pt-BR', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}

          {/* Subtasks */}
          {hasSubtasks && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <CheckCircle2 className="h-3 w-3" />
              <span>
                {subtasksDone}/{task.subtasks.length}
              </span>
            </div>
          )}

          {/* Recurrence indicator */}
          {task.recurrence && (
            <div className="flex items-center gap-1 text-primary">
              <Repeat className="h-3 w-3" />
            </div>
          )}
        </div>

        {/* Area tag */}
        {area && (
          <div className="flex">
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs"
              style={{
                backgroundColor: `${area.color}15`,
                color: area.color,
              }}
            >
              {area.name}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

interface SortableKanbanCardProps {
  task: Task
}

function SortableKanbanCard({ task }: SortableKanbanCardProps) {
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

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <KanbanTaskCard task={task} isDragging={isDragging} />
    </div>
  )
}

interface KanbanColumnProps {
  column: KanbanColumn
  tasks: Task[]
}

function KanbanColumnComponent({ column, tasks }: KanbanColumnProps) {
  const t = useTranslations('tasks')

  return (
    <div className="flex h-full min-w-[280px] flex-col rounded-lg bg-muted/30 lg:min-w-0 lg:flex-1">
      {/* Column Header */}
      <div
        className="flex items-center gap-2 border-b px-3 py-2"
        style={{ borderBottomColor: `${column.color}40` }}
      >
        <div style={{ color: column.color }}>{column.icon}</div>
        <h3 className="font-medium">{t(column.titleKey)}</h3>
        <Badge variant="secondary" className="ml-auto">
          {tasks.length}
        </Badge>
      </div>

      {/* Tasks */}
      <div className="flex-1 overflow-y-auto p-2">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {tasks.map((task) => (
              <SortableKanbanCard key={task.id} task={task} />
            ))}
          </div>
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex h-20 items-center justify-center rounded-lg border-2 border-dashed text-sm text-muted-foreground">
            {t('noTasks')}
          </div>
        )}
      </div>

      {/* Add task button for pending column */}
      {column.id === 'pending' && (
        <div className="border-t p-2">
          <TaskFormDialog>
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <Plus className="mr-2 h-4 w-4" />
              {t('addNew')}
            </Button>
          </TaskFormDialog>
        </div>
      )}
    </div>
  )
}

export function KanbanBoard() {
  const { data: tasks = [] } = useTasks()
  const setTaskStatusMutation = useSetTaskStatus()
  const reorderTasksMutation = useReorderTasks()
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const tasksByStatus: Record<TaskStatus, Task[]> = {
    pending: tasks.filter((t) => t.status === 'pending'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    done: tasks.filter((t) => t.status === 'done'),
  }

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id)
    setActiveTask(task || null)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find which column the task is being dragged over
    const draggedTask = tasks.find((t) => t.id === activeId)
    if (!draggedTask) return

    // Check if dragging over a column
    const overColumn = COLUMNS.find((col) => col.id === overId)
    if (overColumn && draggedTask.status !== overColumn.id) {
      setTaskStatusMutation.mutate({ id: activeId, status: overColumn.id })
      return
    }

    // Check if dragging over another task
    const overTask = tasks.find((t) => t.id === overId)
    if (overTask && draggedTask.status !== overTask.status) {
      setTaskStatusMutation.mutate({ id: activeId, status: overTask.status })
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId !== overId) {
      // Check if dropped on same status tasks for reordering
      const draggedTask = tasks.find((t) => t.id === activeId)
      const overTask = tasks.find((t) => t.id === overId)

      if (draggedTask && overTask && draggedTask.status === overTask.status) {
        const statusTasks = tasks.filter((t) => t.status === draggedTask.status)
        const oldIndex = statusTasks.findIndex((t) => t.id === activeId)
        const newIndex = statusTasks.findIndex((t) => t.id === overId)
        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(statusTasks, oldIndex, newIndex)
          reorderTasksMutation.mutate(newOrder.map((t) => t.id))
        }
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-[calc(100vh-280px)] min-h-[400px] gap-3 overflow-x-auto pb-4 lg:overflow-x-visible">
        {COLUMNS.map((column) => (
          <KanbanColumnComponent
            key={column.id}
            column={column}
            tasks={tasksByStatus[column.id]}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && <KanbanTaskCard task={activeTask} />}
      </DragOverlay>
    </DndContext>
  )
}
