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
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { PageTransition } from '@/components/ui/motion'
import {
  TaskFormDialog,
  SortableTaskCard,
  KanbanBoard,
  CalendarView,
  TaskFiltersComponent,
  filterTasks,
  DEFAULT_FILTERS,
} from '@/components/tasks'
import type { TaskFilters } from '@/components/tasks'
import { useTasks, useSetTaskStatus, useReorderTasks, useDeleteTask } from '@/hooks/queries/use-tasks'
import { toast } from 'sonner'
import { TaskListSkeleton } from '@/components/skeletons'
import { arrayMove } from '@dnd-kit/sortable'
import { Plus, Calendar, ListTodo, LayoutGrid } from 'lucide-react'

export default function TasksPage() {
  const t = useTranslations('tasks')
  const { data: tasks = [], isLoading } = useTasks()
  const setTaskStatusMutation = useSetTaskStatus()
  const reorderTasksMutation = useReorderTasks()
  const deleteTaskMutation = useDeleteTask()
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS)

  // Apply filters to tasks
  const filteredTasks = filterTasks(tasks, filters)
  const pendingTasks = filteredTasks.filter((task) => task.status !== 'done')
  const completedTasks = filteredTasks.filter((task) => task.status === 'done')

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

  const handleToggle = (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'pending' : 'done'
    setTaskStatusMutation.mutate({ id: taskId, status: newStatus as 'pending' | 'done' })
  }

  const handleDelete = (taskId: string) => {
    deleteTaskMutation.mutate(taskId, {
      onSuccess: () => {
        toast.success(t('taskDeleted'))
      },
      onError: () => {
        toast.error(t('taskDeleteError'))
      },
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((t) => t.id === active.id)
      const newIndex = tasks.findIndex((t) => t.id === over.id)
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(tasks, oldIndex, newIndex)
        reorderTasksMutation.mutate(newOrder.map((t) => t.id))
      }
    }
  }

  return (
    <PageTransition className="container mx-auto max-w-md space-y-6 p-4 lg:max-w-4xl lg:p-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <div className="flex items-center gap-2">
          <TaskFiltersComponent filters={filters} onFiltersChange={setFilters} />
          <TaskFormDialog />
        </div>
      </header>

      {/* View Tabs */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list" className="flex items-center gap-1">
            <ListTodo className="h-4 w-4" />
            {t('views.list')}
          </TabsTrigger>
          <TabsTrigger value="kanban" className="flex items-center gap-1">
            <LayoutGrid className="h-4 w-4" />
            {t('views.kanban')}
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {t('views.calendar')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4 space-y-4">
          {/* Pending Tasks */}
          {isLoading ? (
            <TaskListSkeleton count={5} />
          ) : pendingTasks.length === 0 && completedTasks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="mb-4 text-muted-foreground">{t('noTasks')}</p>
                <TaskFormDialog>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    {t('createFirst')}
                  </Button>
                </TaskFormDialog>
              </CardContent>
            </Card>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              {pendingTasks.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-sm font-medium text-muted-foreground">
                    {t('filters.all')} ({pendingTasks.length})
                  </h2>
                  <SortableContext
                    items={pendingTasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {pendingTasks.map((task) => (
                        <SortableTaskCard
                          key={task.id}
                          task={task}
                          onToggle={handleToggle}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </div>
              )}

              {completedTasks.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-sm font-medium text-muted-foreground">
                    {t('filters.completed')} ({completedTasks.length})
                  </h2>
                  <SortableContext
                    items={completedTasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {completedTasks.slice(0, 5).map((task) => (
                        <SortableTaskCard
                          key={task.id}
                          task={task}
                          onToggle={handleToggle}
                          onDelete={handleDelete}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </div>
              )}
            </DndContext>
          )}
        </TabsContent>

        <TabsContent value="kanban" className="mt-4">
          <KanbanBoard />
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <CalendarView />
        </TabsContent>
      </Tabs>
    </PageTransition>
  )
}
