'use client'

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
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageTransition } from '@/components/ui/motion'
import { HabitFormDialog, SortableHabitCard } from '@/components/habits'
import { useActiveHabits, useHabitsStore } from '@/stores/habits'
import { Plus } from 'lucide-react'

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date.toISOString().split('T')[0]
  })
}

export default function HabitsPage() {
  const t = useTranslations('habits')
  const habits = useActiveHabits()
  const reorderHabits = useHabitsStore((state) => state.reorderHabits)

  const last7Days = getLast7Days()

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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      reorderHabits(active.id as string, over.id as string)
    }
  }

  return (
    <PageTransition className="container mx-auto max-w-md space-y-6 p-4 lg:max-w-4xl lg:p-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <HabitFormDialog />
      </header>

      {/* Habits List */}
      {habits.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="mb-4 text-muted-foreground">{t('noHabits')}</p>
            <HabitFormDialog>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                {t('createFirst')}
              </Button>
            </HabitFormDialog>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={habits.map((h) => h.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {habits.map((habit) => (
                <SortableHabitCard
                  key={habit.id}
                  habit={habit}
                  last7Days={last7Days}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </PageTransition>
  )
}
