'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { TaskFormDialog } from '@/components/tasks'
import { useTasksStore } from '@/stores/tasks'
import { Plus, Calendar, ListTodo, LayoutGrid } from 'lucide-react'

export default function TasksPage() {
  const t = useTranslations('tasks')
  const { tasks, setTaskStatus } = useTasksStore()

  const pendingTasks = tasks.filter((task) => task.status !== 'done')
  const completedTasks = tasks.filter((task) => task.status === 'done')

  const priorityColors = {
    low: 'bg-green-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    urgent: 'bg-red-500',
  }

  const handleToggle = (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'pending' : 'done'
    setTaskStatus(taskId, newStatus as 'pending' | 'done')
  }

  return (
    <div className="container mx-auto max-w-md space-y-6 p-4 lg:max-w-4xl lg:p-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <TaskFormDialog />
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
            <>
              {pendingTasks.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-sm font-medium text-muted-foreground">
                    {t('filters.all')} ({pendingTasks.length})
                  </h2>
                  {pendingTasks.map((task) => (
                    <Card key={task.id}>
                      <CardContent className="flex items-center gap-3 p-3">
                        <Checkbox
                          checked={false}
                          onCheckedChange={() => handleToggle(task.id, task.status)}
                        />
                        <div className="flex-1">
                          <p>{task.title}</p>
                          {task.dueDate && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(task.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        {task.priority && (
                          <div
                            className={`h-2 w-2 rounded-full ${priorityColors[task.priority]}`}
                          />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {completedTasks.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-sm font-medium text-muted-foreground">
                    {t('filters.completed')} ({completedTasks.length})
                  </h2>
                  {completedTasks.slice(0, 5).map((task) => (
                    <Card key={task.id} className="opacity-60">
                      <CardContent className="flex items-center gap-3 p-3">
                        <Checkbox
                          checked={true}
                          onCheckedChange={() => handleToggle(task.id, task.status)}
                        />
                        <p className="flex-1 line-through">{task.title}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="kanban" className="mt-4">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Kanban view coming soon...
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Calendar view coming soon...
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
