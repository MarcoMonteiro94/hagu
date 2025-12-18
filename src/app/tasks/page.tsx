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
import { useTasksStore } from '@/stores/tasks'
import { Plus, Calendar, ListTodo, LayoutGrid } from 'lucide-react'

export default function TasksPage() {
  const t = useTranslations('tasks')
  const { tasks, setTaskStatus, reorderTasks } = useTasksStore()
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
    setTaskStatus(taskId, newStatus as 'pending' | 'done')
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      reorderTasks(active.id as string, over.id as string)
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
          {pendingTasks.length === 0 && completedTasks.length === 0 ? (
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
