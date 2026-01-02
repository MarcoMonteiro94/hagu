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
import { Plus, GripVertical, Trash2, Circle, CheckCircle2, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: objective.id,
  })

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
        'group flex items-center gap-2 rounded-lg border bg-card p-3 transition-all',
        isDragging && 'opacity-50 shadow-lg',
        isCompleted && 'opacity-60'
      )}
    >
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

      {objective.dueDate && (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(objective.dueDate).toLocaleDateString()}
        </span>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onDelete(objective.id)}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
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
