'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useTasksStore } from '@/stores/tasks'
import { useActiveHabits, useHabitsStore } from '@/stores/habits'
import { useSettingsStore } from '@/stores/settings'
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  ListTodo,
  Target,
} from 'lucide-react'
import type { Task, Habit } from '@/types'

interface DayData {
  date: Date
  dateStr: string
  isCurrentMonth: boolean
  isToday: boolean
  tasks: Task[]
  habits: {
    habit: Habit
    completed: boolean
  }[]
}

function getMonthDays(year: number, month: number, weekStartsOn: 0 | 1): DayData[] {
  const days: DayData[] = []
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  // First day of the month
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
  let startDayOfWeek = firstDay.getDay()

  // Adjust for week starting on Monday
  if (weekStartsOn === 1) {
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1
  }

  // Add days from previous month to fill the first week
  const prevMonth = new Date(year, month, 0)
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonth.getDate() - i)
    days.push({
      date,
      dateStr: date.toISOString().split('T')[0],
      isCurrentMonth: false,
      isToday: false,
      tasks: [],
      habits: [],
    })
  }

  // Add days of current month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day)
    const dateStr = date.toISOString().split('T')[0]
    days.push({
      date,
      dateStr,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      tasks: [],
      habits: [],
    })
  }

  // Add days from next month to complete the grid (6 rows)
  const remainingDays = 42 - days.length // 6 weeks * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i)
    days.push({
      date,
      dateStr: date.toISOString().split('T')[0],
      isCurrentMonth: false,
      isToday: false,
      tasks: [],
      habits: [],
    })
  }

  return days
}

interface DayDetailDialogProps {
  day: DayData | null
  open: boolean
  onClose: () => void
  onToggleHabit: (habitId: string, date: string, completed: boolean) => void
  onToggleTask: (taskId: string) => void
}

function DayDetailDialog({ day, open, onClose, onToggleHabit, onToggleTask }: DayDetailDialogProps) {
  const t = useTranslations('tasks')
  const tHabits = useTranslations('habits')
  const locale = useSettingsStore((state) => state.locale)

  if (!day) return null

  const formattedDate = day.date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="capitalize">{formattedDate}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Habits Section */}
          {day.habits.length > 0 && (
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Target className="h-4 w-4" />
                {tHabits('title')} ({day.habits.filter(h => h.completed).length}/{day.habits.length})
              </h3>
              <div className="space-y-1">
                {day.habits.map(({ habit, completed }) => (
                  <button
                    key={habit.id}
                    onClick={() => onToggleHabit(habit.id, day.dateStr, completed)}
                    className="flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors hover:bg-muted/50"
                    style={{ borderLeftColor: habit.color, borderLeftWidth: 3 }}
                  >
                    {completed ? (
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: habit.color }} />
                    ) : (
                      <Circle className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    )}
                    <span className={completed ? 'line-through text-muted-foreground' : ''}>
                      {habit.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tasks Section */}
          {day.tasks.length > 0 && (
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <ListTodo className="h-4 w-4" />
                {t('title')} ({day.tasks.filter(t => t.status === 'done').length}/{day.tasks.length})
              </h3>
              <div className="space-y-1">
                {day.tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => onToggleTask(task.id)}
                    className="flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors hover:bg-muted/50"
                  >
                    {task.status === 'done' ? (
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    )}
                    <span className={task.status === 'done' ? 'line-through text-muted-foreground' : ''}>
                      {task.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {day.habits.length === 0 && day.tasks.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              Nenhum hábito ou tarefa para este dia
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function CalendarView() {
  const t = useTranslations('tasks')
  const tDays = useTranslations('days')
  const locale = useSettingsStore((state) => state.locale)
  const weekStartsOn = useSettingsStore((state) => state.weekStartsOn)

  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null)

  const tasks = useTasksStore((state) => state.tasks)
  const { updateTask } = useTasksStore()
  const habits = useActiveHabits()
  const { toggleCompletion } = useHabitsStore()

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const days = useMemo(() => {
    const monthDays = getMonthDays(year, month, weekStartsOn)

    // Populate tasks and habits for each day
    return monthDays.map((day) => ({
      ...day,
      tasks: tasks.filter((t) => t.dueDate === day.dateStr),
      habits: habits.map((habit) => ({
        habit,
        completed: habit.completions.some((c) => c.date === day.dateStr),
      })),
    }))
  }, [year, month, weekStartsOn, tasks, habits])

  const monthLabel = currentDate.toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  })

  const dayLabels = weekStartsOn === 1
    ? ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
    : ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const handleToggleHabit = (habitId: string, date: string, completed: boolean) => {
    toggleCompletion(habitId, date, completed ? 0 : 1)
    // Update selected day data
    if (selectedDay) {
      setSelectedDay({
        ...selectedDay,
        habits: selectedDay.habits.map((h) =>
          h.habit.id === habitId ? { ...h, completed: !completed } : h
        ),
      })
    }
  }

  const handleToggleTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (task) {
      const newStatus = task.status === 'done' ? 'pending' : 'done'
      updateTask(taskId, {
        status: newStatus,
        completedAt: newStatus === 'done' ? new Date().toISOString() : undefined,
      })
      // Update selected day data
      if (selectedDay) {
        setSelectedDay({
          ...selectedDay,
          tasks: selectedDay.tasks.map((t) =>
            t.id === taskId ? { ...t, status: newStatus } : t
          ),
        })
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold capitalize">{monthLabel}</h2>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday}>
          Hoje
        </Button>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardContent className="p-2 sm:p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {dayLabels.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-muted-foreground py-2"
              >
                {tDays(day).slice(0, 3)}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const hasItems = day.tasks.length > 0 || day.habits.some(h => !h.completed)
              const completedHabits = day.habits.filter((h) => h.completed).length
              const totalHabits = day.habits.length
              const completedTasks = day.tasks.filter((t) => t.status === 'done').length
              const totalTasks = day.tasks.length

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDay(day)}
                  className={`
                    relative aspect-square p-1 rounded-lg text-sm transition-colors
                    ${day.isCurrentMonth ? 'hover:bg-muted' : 'text-muted-foreground/50 hover:bg-muted/50'}
                    ${day.isToday ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                  `}
                >
                  <span className={`
                    ${day.isToday ? 'font-bold text-primary' : ''}
                  `}>
                    {day.date.getDate()}
                  </span>

                  {/* Indicators */}
                  {day.isCurrentMonth && (totalHabits > 0 || totalTasks > 0) && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {totalHabits > 0 && (
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${
                            completedHabits === totalHabits
                              ? 'bg-green-500'
                              : completedHabits > 0
                                ? 'bg-yellow-500'
                                : 'bg-muted-foreground/30'
                          }`}
                        />
                      )}
                      {totalTasks > 0 && (
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${
                            completedTasks === totalTasks
                              ? 'bg-blue-500'
                              : completedTasks > 0
                                ? 'bg-blue-300'
                                : 'bg-muted-foreground/30'
                          }`}
                        />
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span>Hábitos completos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-blue-500" />
          <span>Tarefas completas</span>
        </div>
      </div>

      {/* Day Detail Dialog */}
      <DayDetailDialog
        day={selectedDay}
        open={!!selectedDay}
        onClose={() => setSelectedDay(null)}
        onToggleHabit={handleToggleHabit}
        onToggleTask={handleToggleTask}
      />
    </div>
  )
}
