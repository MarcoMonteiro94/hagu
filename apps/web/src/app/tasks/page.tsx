'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { PageTransition } from '@/components/ui/motion'
import {
  TaskFormDialog,
  SortableTaskCard,
  CalendarView,
  TaskFiltersComponent,
  filterTasks,
  DEFAULT_FILTERS,
} from '@/components/tasks'
import type { TaskFilters } from '@/components/tasks'
import { useTasks, useSetTaskStatus, useDeleteTask, useDeleteManyTasks } from '@/hooks/queries/use-tasks'
import { toast } from 'sonner'
import { TaskListSkeleton } from '@/components/skeletons'
import { Plus, Calendar, ListTodo, CheckSquare, Trash2, X, CheckCircle2, AlertCircle, Clock, CalendarDays, CalendarX } from 'lucide-react'
import { getTodayString } from '@/lib/utils'
import type { Task } from '@/types'

// Helper function to categorize tasks by date
function categorizeTasks(tasks: Task[]) {
  const today = getTodayString()

  const overdue: Task[] = []
  const todayTasks: Task[] = []
  const upcoming: Task[] = []
  const noDate: Task[] = []

  for (const task of tasks) {
    if (!task.dueDate) {
      noDate.push(task)
    } else if (task.dueDate < today) {
      overdue.push(task)
    } else if (task.dueDate === today) {
      todayTasks.push(task)
    } else {
      upcoming.push(task)
    }
  }

  // Sort by due date (earliest first), then by priority
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
  const sortByDateAndPriority = (a: Task, b: Task) => {
    if (a.dueDate && b.dueDate) {
      if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate)
    }
    const aPriority = priorityOrder[a.priority ?? 'low'] ?? 3
    const bPriority = priorityOrder[b.priority ?? 'low'] ?? 3
    return aPriority - bPriority
  }

  overdue.sort(sortByDateAndPriority)
  todayTasks.sort(sortByDateAndPriority)
  upcoming.sort(sortByDateAndPriority)
  noDate.sort((a, b) => {
    const aPriority = priorityOrder[a.priority ?? 'low'] ?? 3
    const bPriority = priorityOrder[b.priority ?? 'low'] ?? 3
    return aPriority - bPriority
  })

  return { overdue, todayTasks, upcoming, noDate }
}

export default function TasksPage() {
  const t = useTranslations('tasks')
  const tCommon = useTranslations('common')
  const { data: tasks = [], isLoading } = useTasks()
  const setTaskStatusMutation = useSetTaskStatus()
  const deleteTaskMutation = useDeleteTask()
  const deleteManyTasksMutation = useDeleteManyTasks()
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null)

  // Apply filters to tasks
  const filteredTasks = filterTasks(tasks, filters)
  const pendingTasks = filteredTasks.filter((task) => task.status !== 'done')
  const completedTasks = filteredTasks.filter((task) => task.status === 'done')

  // Categorize pending tasks by date
  const { overdue, todayTasks, upcoming, noDate } = categorizeTasks(pendingTasks)

  const handleSelectTask = (taskId: string, selected: boolean) => {
    setSelectedTasks((prev) => {
      const next = new Set(prev)
      if (selected) {
        next.add(taskId)
      } else {
        next.delete(taskId)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    const allTaskIds = filteredTasks.map((t) => t.id)
    setSelectedTasks(new Set(allTaskIds))
  }

  const handleDeselectAll = () => {
    setSelectedTasks(new Set())
  }

  const handleDeleteSelected = () => {
    if (selectedTasks.size === 0) return
    setShowDeleteConfirm(true)
  }

  const confirmDeleteSelected = () => {
    const ids = Array.from(selectedTasks)
    deleteManyTasksMutation.mutate(ids, {
      onSuccess: () => {
        toast.success(t('bulkDelete.success', { count: ids.length }))
        setSelectedTasks(new Set())
        setSelectionMode(false)
      },
      onError: () => {
        toast.error(t('bulkDelete.error'))
      },
    })
    setShowDeleteConfirm(false)
  }

  const exitSelectionMode = () => {
    setSelectionMode(false)
    setSelectedTasks(new Set())
  }

  const handleToggle = (taskId: string, currentStatus: string) => {
    if (togglingTaskId === taskId) return

    const newStatus = currentStatus === 'done' ? 'pending' : 'done'
    setTogglingTaskId(taskId)

    setTaskStatusMutation.mutate(
      { id: taskId, status: newStatus as 'pending' | 'done' },
      {
        onSettled: () => {
          setTogglingTaskId(null)
        },
      }
    )
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

  return (
    <PageTransition className="container mx-auto max-w-md space-y-6 p-4 pb-24 lg:max-w-4xl lg:p-6 lg:pb-6">
      {/* Header */}
      <header className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">{t('title')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {pendingTasks.length > 0 ? `${pendingTasks.length} ${pendingTasks.length === 1 ? 'tarefa' : 'tarefas'} pendentes` : 'Nenhuma tarefa pendente'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!selectionMode ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectionMode(true)}
                  disabled={filteredTasks.length === 0}
                  className="h-9 rounded-xl px-3"
                >
                  <CheckSquare className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t('bulkDelete.select')}</span>
                </Button>
                <TaskFiltersComponent filters={filters} onFiltersChange={setFilters} />
                <TaskFormDialog />
              </>
            ) : (
              <>
                <Button variant="ghost" size="icon" onClick={exitSelectionMode} className="h-9 w-9 rounded-xl">
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Selection Mode Actions Bar */}
        {selectionMode && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-muted/50 p-3 border border-border/50">
            <span className="text-sm font-medium">
              {t('bulkDelete.selected', { count: selectedTasks.size })}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleSelectAll} className="h-8 rounded-lg text-xs sm:text-sm">
                {t('bulkDelete.selectAll')}
              </Button>
              {selectedTasks.size > 0 && (
                <Button variant="outline" size="sm" onClick={handleDeselectAll} className="h-8 rounded-lg text-xs sm:text-sm">
                  {t('bulkDelete.deselectAll')}
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
                disabled={selectedTasks.size === 0}
                className="h-8 rounded-lg px-3"
              >
                <Trash2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('bulkDelete.deleteSelected')}</span>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* View Tabs */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-3 rounded-xl bg-muted/50 p-1">
          <TabsTrigger value="list" className="flex items-center gap-1.5 rounded-lg px-3 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <ListTodo className="h-4 w-4 shrink-0" />
            <span className="truncate">{t('views.list')}</span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-1.5 rounded-lg px-3 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="truncate">{t('views.completed')}</span>
            {completedTasks.length > 0 && (
              <span className="ml-1 shrink-0 rounded-full bg-muted px-1.5 text-[10px] font-medium sm:text-xs">{completedTasks.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-1.5 rounded-lg px-3 text-xs sm:text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Calendar className="h-4 w-4 shrink-0" />
            <span className="truncate">{t('views.calendar')}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-4 space-y-6">
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
            <>
              {/* Overdue Section */}
              {overdue.length > 0 && (
                <div className="space-y-2">
                  <h2 className="flex items-center gap-2 text-sm font-medium text-red-500">
                    <AlertCircle className="h-4 w-4" />
                    {t('filters.overdue')} ({overdue.length})
                  </h2>
                  <div className="space-y-2">
                    {overdue.map((task) => (
                      <SortableTaskCard
                        key={task.id}
                        task={task}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                        selectionMode={selectionMode}
                        selected={selectedTasks.has(task.id)}
                        onSelect={handleSelectTask}
                        isToggling={togglingTaskId === task.id}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Today Section */}
              {todayTasks.length > 0 && (
                <div className="space-y-2">
                  <h2 className="flex items-center gap-2 text-sm font-medium text-primary">
                    <Clock className="h-4 w-4" />
                    {t('filters.today')} ({todayTasks.length})
                  </h2>
                  <div className="space-y-2">
                    {todayTasks.map((task) => (
                      <SortableTaskCard
                        key={task.id}
                        task={task}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                        selectionMode={selectionMode}
                        selected={selectedTasks.has(task.id)}
                        onSelect={handleSelectTask}
                        isToggling={togglingTaskId === task.id}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Section */}
              {upcoming.length > 0 && (
                <div className="space-y-2">
                  <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    {t('filters.upcoming')} ({upcoming.length})
                  </h2>
                  <div className="space-y-2">
                    {upcoming.map((task) => (
                      <SortableTaskCard
                        key={task.id}
                        task={task}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                        selectionMode={selectionMode}
                        selected={selectedTasks.has(task.id)}
                        onSelect={handleSelectTask}
                        isToggling={togglingTaskId === task.id}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* No Date Section */}
              {noDate.length > 0 && (
                <div className="space-y-2">
                  <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <CalendarX className="h-4 w-4" />
                    {t('filters.noDate')} ({noDate.length})
                  </h2>
                  <div className="space-y-2">
                    {noDate.map((task) => (
                      <SortableTaskCard
                        key={task.id}
                        task={task}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                        selectionMode={selectionMode}
                        selected={selectedTasks.has(task.id)}
                        onSelect={handleSelectTask}
                        isToggling={togglingTaskId === task.id}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4 space-y-4">
          {completedTasks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">{t('noCompletedTasks')}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {completedTasks.map((task) => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  selectionMode={selectionMode}
                  selected={selectedTasks.has(task.id)}
                  onSelect={handleSelectTask}
                  isToggling={togglingTaskId === task.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <CalendarView />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('bulkDelete.confirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('bulkDelete.confirmDescription', { count: selectedTasks.size })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSelected}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  )
}
