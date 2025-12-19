'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { PageTransition } from '@/components/ui/motion'
import { AreaFormDialog } from '@/components/areas'
import { useOrderedAreas, useReorderAreas } from '@/hooks/queries/use-areas'
import { useHabits } from '@/hooks/queries/use-habits'
import { useTasks } from '@/hooks/queries/use-tasks'
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
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Heart,
  BookOpen,
  Wallet,
  Palette,
  Briefcase,
  Home,
  Users,
  Dumbbell,
  Music,
  Camera,
  Plane,
  Coffee,
  Gamepad2,
  Sparkles,
  Brain,
  Target,
  ChevronRight,
  GripVertical,
} from 'lucide-react'
import type { LifeArea } from '@/types'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  heart: Heart,
  book: BookOpen,
  wallet: Wallet,
  palette: Palette,
  briefcase: Briefcase,
  home: Home,
  users: Users,
  dumbbell: Dumbbell,
  music: Music,
  camera: Camera,
  plane: Plane,
  coffee: Coffee,
  gamepad: Gamepad2,
  sparkles: Sparkles,
  brain: Brain,
  target: Target,
}

interface SortableAreaCardProps {
  area: LifeArea
  habitsCount: number
  tasksCount: number
  t: (key: string) => string
}

function SortableAreaCard({ area, habitsCount, tasksCount, t }: SortableAreaCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: area.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 0,
  }

  const IconComponent = ICON_MAP[area.icon] || Palette

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <Link href={`/areas/${area.slug}`}>
        <Card className="cursor-pointer transition-colors hover:bg-accent/50">
          <CardContent className="flex items-center gap-4 p-4">
            <button
              {...attributes}
              {...listeners}
              className="touch-none cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
              onClick={(e) => e.preventDefault()}
            >
              <GripVertical className="h-5 w-5" />
            </button>
            <div
              className="flex h-12 w-12 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${area.color}20`, color: area.color }}
            >
              <IconComponent className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">{area.name}</h3>
              <p className="text-sm text-muted-foreground">
                {habitsCount} {t('habits').toLowerCase()} •{' '}
                {tasksCount} {t('tasks').toLowerCase()}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}

export default function AreasPage() {
  const t = useTranslations('areas')
  const [mounted, setMounted] = useState(false)
  const { data: areas = [], isLoading } = useOrderedAreas()
  const reorderAreasMutation = useReorderAreas()
  const { data: habits = [] } = useHabits()
  const { data: tasks = [] } = useTasks()

  useEffect(() => {
    setMounted(true)
  }, [])

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
      const oldIndex = areas.findIndex((a) => a.id === active.id)
      const newIndex = areas.findIndex((a) => a.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = [...areas]
        const [movedItem] = newOrder.splice(oldIndex, 1)
        newOrder.splice(newIndex, 0, movedItem)
        reorderAreasMutation.mutate(newOrder.map((a) => a.id))
      }
    }
  }

  if (!mounted) {
    return (
      <div className="container mx-auto max-w-md space-y-6 p-4 lg:max-w-4xl lg:p-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t('title')}</h1>
        </header>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <PageTransition className="container mx-auto max-w-md space-y-6 p-4 lg:max-w-4xl lg:p-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <AreaFormDialog />
      </header>

      {/* Areas Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={areas.map((a) => a.id)} strategy={rectSortingStrategy}>
          <div className="grid gap-4 sm:grid-cols-2">
            {areas.map((area) => {
              const areaHabits = habits.filter(
                (h) => h.areaId === area.id && !h.archivedAt
              )
              const areaTasks = tasks.filter(
                (t) => t.areaId === area.id && t.status !== 'done'
              )

              return (
                <SortableAreaCard
                  key={area.id}
                  area={area}
                  habitsCount={areaHabits.length}
                  tasksCount={areaTasks.length}
                  t={t}
                />
              )
            })}
          </div>
        </SortableContext>
      </DndContext>
    </PageTransition>
  )
}
