'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useMetricsByArea } from '@/hooks/queries/use-areas'
import { useActiveHabits } from '@/hooks/queries/use-habits'
import { Heart, Scale, Smile, Zap, Moon, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

const HEALTH_AREA_ID = 'health' // Area slug for health

const METRIC_ICONS: Record<string, React.ReactNode> = {
  weight: <Scale className="h-4 w-4" />,
  mood: <Smile className="h-4 w-4" />,
  energy: <Zap className="h-4 w-4" />,
  sleep: <Moon className="h-4 w-4" />,
}

const METRIC_UNITS: Record<string, string> = {
  weight: 'kg',
  mood: '',
  energy: '',
  sleep: 'h',
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

export function HealthWidget() {
  const t = useTranslations('home')
  const tHealth = useTranslations('health')
  const { data: metrics = [], isLoading: isLoadingMetrics } = useMetricsByArea(HEALTH_AREA_ID)
  const { data: habits = [], isLoading: isLoadingHabits } = useActiveHabits()

  const today = getTodayString()

  // Get latest metrics (one per type, from last 7 days)
  const recentMetrics = metrics
    .filter((m) => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return new Date(m.date) >= weekAgo
    })
    .reduce<Record<string, typeof metrics[0]>>((acc, m) => {
      if (!acc[m.type] || new Date(m.date) > new Date(acc[m.type].date)) {
        acc[m.type] = m
      }
      return acc
    }, {})

  // Get previous metrics for trend calculation
  const previousMetrics = metrics.reduce<Record<string, typeof metrics[0]>>((acc, m) => {
    const latest = recentMetrics[m.type]
    if (latest && m.date < latest.date && (!acc[m.type] || m.date > acc[m.type].date)) {
      acc[m.type] = m
    }
    return acc
  }, {})

  // Filter health-related habits (by area)
  const healthHabits = habits.filter((h) => h.areaId === HEALTH_AREA_ID)
  const completedHealthHabits = healthHabits.filter((h) =>
    h.completions.some((c) => c.date === today)
  )
  const healthProgress = healthHabits.length > 0
    ? Math.round((completedHealthHabits.length / healthHabits.length) * 100)
    : 0

  const isLoading = isLoadingMetrics || isLoadingHabits

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{tHealth('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-8 animate-pulse rounded-lg bg-muted" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-14 animate-pulse rounded-lg bg-muted" />
              <div className="h-14 animate-pulse rounded-lg bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const latestMetricTypes = Object.keys(recentMetrics).slice(0, 4)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{tHealth('title')}</CardTitle>
          <Link href="/areas/health">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Heart className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Health Habits Progress */}
        {healthHabits.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{t('healthHabitsProgress')}</span>
              <span className="font-medium">{completedHealthHabits.length}/{healthHabits.length}</span>
            </div>
            <Progress value={healthProgress} className="h-2" />
          </div>
        )}

        {/* Recent Metrics */}
        {latestMetricTypes.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {latestMetricTypes.map((type) => {
              const metric = recentMetrics[type]
              const previous = previousMetrics[type]
              const trend = previous
                ? metric.value > previous.value
                  ? 'up'
                  : metric.value < previous.value
                  ? 'down'
                  : 'same'
                : null

              return (
                <div key={type} className="rounded-lg border p-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">
                      {METRIC_ICONS[type] ?? <Heart className="h-4 w-4" />}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {tHealth(type as 'weight' | 'mood' | 'energy' | 'sleep')}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-lg font-semibold">
                      {metric.value}
                      {METRIC_UNITS[type] && (
                        <span className="text-xs text-muted-foreground ml-0.5">
                          {METRIC_UNITS[type]}
                        </span>
                      )}
                    </span>
                    {trend && (
                      <span className={cn(
                        'ml-auto',
                        trend === 'up' && 'text-green-500',
                        trend === 'down' && 'text-red-500',
                        trend === 'same' && 'text-muted-foreground'
                      )}>
                        {trend === 'up' && <TrendingUp className="h-3 w-3" />}
                        {trend === 'down' && <TrendingDown className="h-3 w-3" />}
                        {trend === 'same' && <Minus className="h-3 w-3" />}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : healthHabits.length === 0 ? (
          <p className="py-2 text-center text-sm text-muted-foreground">
            {t('noHealthData')}
          </p>
        ) : null}

        <Link href="/areas/health">
          <Button variant="ghost" className="w-full" size="sm">
            {t('viewDetails')}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
