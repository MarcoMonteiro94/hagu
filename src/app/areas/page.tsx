'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useOrderedAreas } from '@/stores/areas'
import { useHabitsStore } from '@/stores/habits'
import { useTasksStore } from '@/stores/tasks'
import { Plus, Heart, BookOpen, Wallet, Palette, ChevronRight } from 'lucide-react'

const AREA_ICONS: Record<string, React.ReactNode> = {
  heart: <Heart className="h-6 w-6" />,
  book: <BookOpen className="h-6 w-6" />,
  wallet: <Wallet className="h-6 w-6" />,
  palette: <Palette className="h-6 w-6" />,
}

export default function AreasPage() {
  const t = useTranslations('areas')
  const areas = useOrderedAreas()
  const habits = useHabitsStore((state) => state.habits)
  const tasks = useTasksStore((state) => state.tasks)

  return (
    <div className="container mx-auto max-w-md space-y-6 p-4 lg:max-w-4xl lg:p-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Button size="sm">
          <Plus className="mr-1 h-4 w-4" />
          {t('addNew')}
        </Button>
      </header>

      {/* Areas Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {areas.map((area) => {
          const areaHabits = habits.filter(
            (h) => h.areaId === area.id && !h.archivedAt
          )
          const areaTasks = tasks.filter(
            (t) => t.areaId === area.id && t.status !== 'done'
          )

          return (
            <Link key={area.id} href={`/areas/${area.slug}`}>
              <Card className="cursor-pointer transition-colors hover:bg-accent/50">
                <CardContent className="flex items-center gap-4 p-4">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${area.color}20`, color: area.color }}
                  >
                    {AREA_ICONS[area.icon] || <Palette className="h-6 w-6" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{area.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {areaHabits.length} {t('habits').toLowerCase()} •{' '}
                      {areaTasks.length} {t('tasks').toLowerCase()}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
