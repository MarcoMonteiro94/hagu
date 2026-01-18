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
import { useActiveHabits, useReorderHabits } from '@/hooks/queries/use-habits'
import { HabitPageCardSkeleton } from '@/components/skeletons'
import { Plus } from 'lucide-react'
import { arrayMove } from '@dnd-kit/sortable'

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date.toISOString().split('T')[0]
  })
}

export default function HabitsPage() {
  const t = useTranslations('habits')
  const { data: habits = [], isLoading } = useActiveHabits()
  const reorderHabitsMutation = useReorderHabits()

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
      const oldIndex = habits.findIndex((h) => h.id === active.id)
      const newIndex = habits.findIndex((h) => h.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(habits, oldIndex, newIndex)
        reorderHabitsMutation.mutate(newOrder.map((h) => h.id))
      }
    }
  }

  return (
    <PageTransition className="container mx-auto max-w-md space-y-6 p-4 pb-24 lg:max-w-4xl lg:p-6 lg:pb-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {habits.length > 0 ? `${habits.length} ${habits.length === 1 ? 'hábito' : 'hábitos'} ativos` : ''}
          </p>
        </div>
        <HabitFormDialog />
      </header>

      {/* Habits List */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <HabitPageCardSkeleton count={6} />
        </div>
      ) : habits.length === 0 ? (
        <Card variant="outlined" className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Plus className="h-7 w-7 text-primary" />
            </div>
            <h3 className="mb-1 font-semibold">{t('noHabits')}</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Comece a construir hábitos saudáveis
            </p>
            <HabitFormDialog>
              <Button className="rounded-xl">
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
