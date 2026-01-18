'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useMetricsByArea, useCreateMetric, useAreaBySlug } from '@/hooks/queries/use-areas'
import { useActiveHabits } from '@/hooks/queries/use-habits'
import { MetricChart, WeightGoalDialog } from '@/components/health'
import {
  ArrowLeft,
  Plus,
  Scale,
  Smile,
  Zap,
  Moon,
  Droplets,
  Heart,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
} from 'lucide-react'

type MetricType = 'weight' | 'mood' | 'energy' | 'sleep' | 'water'

interface MetricConfig {
  type: MetricType
  icon: React.ReactNode
  unit: string
  min: number
  max: number
  step: number
  color: string
}

const METRIC_CONFIGS: MetricConfig[] = [
  {
    type: 'weight',
    icon: <Scale className="h-5 w-5" />,
    unit: 'kg',
    min: 30,
    max: 200,
    step: 0.1,
    color: '#22c55e',
  },
  {
    type: 'mood',
    icon: <Smile className="h-5 w-5" />,
    unit: '',
    min: 1,
    max: 5,
    step: 1,
    color: '#eab308',
  },
  {
    type: 'energy',
    icon: <Zap className="h-5 w-5" />,
    unit: '',
    min: 1,
    max: 5,
    step: 1,
    color: '#f97316',
  },
  {
    type: 'sleep',
    icon: <Moon className="h-5 w-5" />,
    unit: 'h',
    min: 0,
    max: 14,
    step: 0.5,
    color: '#8b5cf6',
  },
  {
    type: 'water',
    icon: <Droplets className="h-5 w-5" />,
    unit: 'L',
    min: 0,
    max: 5,
    step: 0.25,
    color: '#3b82f6',
  },
]

const MOOD_LABELS = ['', 'Muito mal', 'Mal', 'Neutro', 'Bem', 'Muito bem']
const ENERGY_LABELS = ['', 'Exausto', 'Cansado', 'Normal', 'Energizado', 'Muito energizado']

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

export default function HealthPage() {
  const router = useRouter()
  const t = useTranslations('health')
  const tCommon = useTranslations('common')

  // Fetch the health area to get its actual ID
  const { data: healthArea } = useAreaBySlug('health')
  const areaId = healthArea?.id

  const { data: allMetrics = [] } = useMetricsByArea(areaId ?? '')
  const createMetricMutation = useCreateMetric()
  const { data: habits = [] } = useActiveHabits()
  const healthHabits = habits.filter((h) => h.areaId === areaId)

  // Helper to filter metrics by type
  const getMetricsByType = (type: MetricType) => {
    return allMetrics
      .filter((m) => m.type === type)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  const [isAddingMetric, setIsAddingMetric] = useState(false)
  const [selectedMetricType, setSelectedMetricType] = useState<MetricType>('weight')
  const [metricValue, setMetricValue] = useState('')
  const [metricDate, setMetricDate] = useState(getTodayString())

  const handleAddMetric = async () => {
    if (!metricValue || !areaId) return

    try {
      await createMetricMutation.mutateAsync({
        areaId,
        type: selectedMetricType,
        value: parseFloat(metricValue),
        unit: METRIC_CONFIGS.find((c) => c.type === selectedMetricType)?.unit,
        date: metricDate,
      })

      setMetricValue('')
      setMetricDate(getTodayString())
      setIsAddingMetric(false)
    } catch (error) {
      console.error('Failed to add metric:', error)
    }
  }

  const getLatestMetric = (type: MetricType) => {
    const typeMetrics = getMetricsByType(type)
    return typeMetrics.length > 0 ? typeMetrics[typeMetrics.length - 1] : null
  }

  const getMetricTrend = (type: MetricType) => {
    const typeMetrics = getMetricsByType(type)
    if (typeMetrics.length < 2) return 'neutral'

    const latest = typeMetrics[typeMetrics.length - 1]
    const previous = typeMetrics[typeMetrics.length - 2]

    if (latest.value > previous.value) return 'up'
    if (latest.value < previous.value) return 'down'
    return 'neutral'
  }

  const formatMetricValue = (type: MetricType, value: number) => {
    if (type === 'mood') return MOOD_LABELS[value] || value
    if (type === 'energy') return ENERGY_LABELS[value] || value

    const config = METRIC_CONFIGS.find((c) => c.type === type)
    return `${value}${config?.unit ? ` ${config.unit}` : ''}`
  }

  const selectedConfig = METRIC_CONFIGS.find((c) => c.type === selectedMetricType)

  return (
    <div className="container mx-auto max-w-md space-y-6 p-4 lg:max-w-4xl lg:p-6">
      {/* Header */}
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-green-500" />
            <h1 className="text-xl font-bold lg:text-2xl">{t('title')}</h1>
          </div>
        </div>
        <Dialog open={isAddingMetric} onOpenChange={setIsAddingMetric}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              {t('addMetric')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('addMetric')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Tipo de métrica</Label>
                <Select
                  value={selectedMetricType}
                  onValueChange={(v) => setSelectedMetricType(v as MetricType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METRIC_CONFIGS.map((config) => (
                      <SelectItem key={config.type} value={config.type}>
                        <div className="flex items-center gap-2">
                          {config.icon}
                          <span>{t(config.type)}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={metricDate}
                  onChange={(e) => setMetricDate(e.target.value)}
                  max={getTodayString()}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  Valor {selectedConfig?.unit && `(${selectedConfig.unit})`}
                </Label>
                {selectedMetricType === 'mood' || selectedMetricType === 'energy' ? (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Button
                        key={value}
                        type="button"
                        variant={metricValue === String(value) ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => setMetricValue(String(value))}
                      >
                        {value}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <Input
                    type="number"
                    value={metricValue}
                    onChange={(e) => setMetricValue(e.target.value)}
                    min={selectedConfig?.min}
                    max={selectedConfig?.max}
                    step={selectedConfig?.step}
                    placeholder={`Ex: ${selectedConfig?.min}`}
                  />
                )}
                {selectedMetricType === 'mood' && metricValue && (
                  <p className="text-sm text-muted-foreground">
                    {MOOD_LABELS[parseInt(metricValue)]}
                  </p>
                )}
                {selectedMetricType === 'energy' && metricValue && (
                  <p className="text-sm text-muted-foreground">
                    {ENERGY_LABELS[parseInt(metricValue)]}
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsAddingMetric(false)}
                >
                  {tCommon('cancel')}
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleAddMetric}
                  disabled={!metricValue || !areaId || createMetricMutation.isPending}
                >
                  {createMetricMutation.isPending ? tCommon('saving') : tCommon('save')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {METRIC_CONFIGS.map((config) => {
          const latest = getLatestMetric(config.type)
          const trend = getMetricTrend(config.type)

          return (
            <Card key={config.type}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div
                    className="rounded-lg p-2"
                    style={{ backgroundColor: `${config.color}20` }}
                  >
                    <div style={{ color: config.color }}>{config.icon}</div>
                  </div>
                  {latest && (
                    <div className="text-muted-foreground">
                      {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                      {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                      {trend === 'neutral' && <Minus className="h-4 w-4" />}
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">{t(config.type)}</p>
                  <p className="font-semibold">
                    {latest
                      ? formatMetricValue(config.type, latest.value)
                      : '-'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts */}
      <Tabs defaultValue="weight" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          {METRIC_CONFIGS.map((config) => (
            <TabsTrigger
              key={config.type}
              value={config.type}
              className="flex items-center gap-1 text-xs"
            >
              {config.icon}
              <span className="hidden sm:inline">{t(config.type)}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {METRIC_CONFIGS.map((config) => {
          const typeMetrics = getMetricsByType(config.type)

          return (
            <TabsContent key={config.type} value={config.type} className="mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      {config.icon}
                      {t('evolution')} - {t(config.type)}
                    </CardTitle>
                    {config.type === 'weight' && (
                      <WeightGoalDialog>
                        <Button variant="ghost" size="sm" className="gap-1 text-xs">
                          <Target className="h-4 w-4" />
                          <span className="hidden sm:inline">{t('setGoal')}</span>
                        </Button>
                      </WeightGoalDialog>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {typeMetrics.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground">
                        Nenhum registro de {t(config.type).toLowerCase()}
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => {
                          setSelectedMetricType(config.type)
                          setIsAddingMetric(true)
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar primeiro registro
                      </Button>
                    </div>
                  ) : (
                    <MetricChart
                      data={typeMetrics}
                      color={config.color}
                      unit={config.unit}
                      type={config.type}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}
      </Tabs>

      {/* Health Habits */}
      {healthHabits.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Hábitos de Saúde</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {healthHabits.map((habit) => {
                const today = getTodayString()
                const isCompleted = habit.completions.some((c) => c.date === today)

                return (
                  <div
                    key={habit.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                    style={{ borderLeftColor: habit.color, borderLeftWidth: 4 }}
                  >
                    <span className={isCompleted ? 'line-through text-muted-foreground' : ''}>
                      {habit.title}
                    </span>
                    {isCompleted && (
                      <span className="text-xs text-green-500">Concluído</span>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
