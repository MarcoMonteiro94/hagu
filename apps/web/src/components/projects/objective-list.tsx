'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  useObjectivesByProject,
  useCreateObjective,
  useUpdateObjective,
  useDeleteObjective,
  useCompleteObjective,
  useReorderObjectives,
} from '@/hooks/queries/use-projects'
import type { Objective, ObjectiveStatus } from '@/types'
import { Plus, GripVertical, Trash2, Circle, CheckCircle2, Clock, ListTodo, ChevronDown, ChevronRight, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useTasksByObjective } from '@/hooks/queries/use-tasks'
import { TaskFormDialog } from '@/components/tasks/task-form-dialog'
import { LinkTasksDialog } from '@/components/projects/link-tasks-dialog'

const STATUS_ICONS: Record<ObjectiveStatus, React.ElementType> = {
  pending: Circle,
  in_progress: Clock,
  completed: CheckCircle2,
}

interface SortableObjectiveItemProps {
  objective: Objective
  projectId: string
  color?: string
  onStatusChange: (id: string, status: ObjectiveStatus) => void
  onDelete: (id: string) => void
}

function SortableObjectiveItem({
  objective,
  projectId,
  color,
  onStatusChange,
  onDelete,
}: SortableObjectiveItemProps) {
  const t = useTranslations('projects')
  const [isExpanded, setIsExpanded] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: objective.id,
  })

  const { data: tasks = [] } = useTasksByObjective(objective.id)
  const pendingTasks = tasks.filter((task) => task.status !== 'done')
  const completedTasks = tasks.filter((task) => task.status === 'done')

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const StatusIcon = STATUS_ICONS[objective.status]
  const isCompleted = objective.status === 'completed'

  const cycleStatus = () => {
    const nextStatus: Record<ObjectiveStatus, ObjectiveStatus> = {
      pending: 'in_progress',
      in_progress: 'completed',
      completed: 'pending',
    }
    onStatusChange(objective.id, nextStatus[objective.status])
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'rounded-lg border bg-card transition-all',
        isDragging && 'opacity-50 shadow-lg',
        isCompleted && 'opacity-60'
      )}
    >
      <div className="group flex items-center gap-2 p-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <button
          onClick={cycleStatus}
          className="flex-shrink-0 transition-colors"
          style={{ color: isCompleted ? color : undefined }}
          aria-label={t(`objectiveStatus.${objective.status}`)}
        >
          <StatusIcon className={cn('h-5 w-5', isCompleted && 'fill-current')} />
        </button>

        <div className="flex-1 min-w-0">
          <p className={cn('font-medium truncate', isCompleted && 'line-through')}>
            {objective.title}
          </p>
          {objective.description && (
            <p className="text-sm text-muted-foreground truncate">{objective.description}</p>
          )}
        </div>

        {/* Task count badge */}
        {tasks.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ListTodo className="h-3.5 w-3.5" />
            <span>{completedTasks.length}/{tasks.length}</span>
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        )}

        {objective.dueDate && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {new Date(objective.dueDate).toLocaleDateString()}
          </span>
        )}

        {/* Link Existing Tasks Button */}
        <LinkTasksDialog
          projectId={projectId}
          objectiveId={objective.id}
          objectiveTitle={objective.title}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            title={t('linkTasks')}
          >
            <Link2 className="h-4 w-4" />
          </Button>
        </LinkTasksDialog>

        {/* Add Task Button */}
        <TaskFormDialog
          defaultProjectId={projectId}
          defaultObjectiveId={objective.id}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </TaskFormDialog>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onDelete(objective.id)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      {/* Tasks List */}
      {isExpanded && tasks.length > 0 && (
        <div className="border-t px-3 py-2 space-y-1">
          {pendingTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-2 text-sm py-1 px-2 rounded hover:bg-muted/50"
            >
              <Circle className="h-3 w-3 text-muted-foreground" />
              <span className="truncate">{task.title}</span>
            </div>
          ))}
          {completedTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-2 text-sm py-1 px-2 rounded hover:bg-muted/50 text-muted-foreground"
            >
              <CheckCircle2 className="h-3 w-3" style={{ color }} />
              <span className="truncate line-through">{task.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface ObjectiveListProps {
  projectId: string
  color?: string
}

export function ObjectiveList({ projectId, color }: ObjectiveListProps) {
  const t = useTranslations('projects')
  const [newObjectiveTitle, setNewObjectiveTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const { data: objectives = [], isLoading } = useObjectivesByProject(projectId)
  const createObjectiveMutation = useCreateObjective()
  const updateObjectiveMutation = useUpdateObjective()
  const deleteObjectiveMutation = useDeleteObjective()
  const completeObjectiveMutation = useCompleteObjective()
  const reorderObjectivesMutation = useReorderObjectives()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = objectives.findIndex((o) => o.id === active.id)
      const newIndex = objectives.findIndex((o) => o.id === over.id)
      const reordered = arrayMove(objectives, oldIndex, newIndex)
      const orderedIds = reordered.map((o) => o.id)

      reorderObjectivesMutation.mutate({ orderedIds, projectId })
    }
  }

  const handleAddObjective = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newObjectiveTitle.trim()) return

    try {
      await createObjectiveMutation.mutateAsync({
        projectId,
        title: newObjectiveTitle.trim(),
      })
      setNewObjectiveTitle('')
      setIsAdding(false)
      toast.success(t('objectiveCreated'))
    } catch (error) {
      toast.error(t('objectiveCreateError'))
    }
  }

  const handleStatusChange = async (id: string, status: ObjectiveStatus) => {
    try {
      if (status === 'completed') {
        await completeObjectiveMutation.mutateAsync({ id, projectId })
      } else {
        await updateObjectiveMutation.mutateAsync({ id, updates: { status }, projectId })
      }
    } catch (error) {
      toast.error(t('objectiveUpdateError'))
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteObjectiveMutation.mutateAsync({ id, projectId })
      toast.success(t('objectiveDeleted'))
    } catch (error) {
      toast.error(t('objectiveDeleteError'))
    }
  }

  if (isLoading) {
    return <div className="animate-pulse space-y-2">{[1, 2, 3].map((i) => (
      <div key={i} className="h-14 rounded-lg bg-muted" />
    ))}</div>
  }

  const completedCount = objectives.filter((o) => o.status === 'completed').length
  const totalCount = objectives.length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{t('objectives')}</h3>
          {totalCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {completedCount}/{totalCount} {t('completed')}
            </p>
          )}
        </div>
        {!isAdding && (
          <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="mr-1 h-4 w-4" />
            {t('addObjective')}
          </Button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAddObjective} className="flex gap-2">
          <Input
            value={newObjectiveTitle}
            onChange={(e) => setNewObjectiveTitle(e.target.value)}
            placeholder={t('objectivePlaceholder')}
            autoFocus
          />
          <Button type="submit" disabled={createObjectiveMutation.isPending}>
            {t('add')}
          </Button>
          <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>
            {t('cancel')}
          </Button>
        </form>
      )}

      {objectives.length === 0 && !isAdding ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
          <p>{t('noObjectives')}</p>
          <Button variant="link" className="mt-2" onClick={() => setIsAdding(true)}>
            {t('addFirstObjective')}
          </Button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={objectives.map((o) => o.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {objectives.map((objective) => (
                <SortableObjectiveItem
                  key={objective.id}
                  objective={objective}
                  projectId={projectId}
                  color={color}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
