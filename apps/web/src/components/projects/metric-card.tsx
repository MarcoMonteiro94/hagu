'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  useProjectMetricsByProject,
  useCreateProjectMetric,
  useUpdateProjectMetricValue,
  useDeleteProjectMetric,
} from '@/hooks/queries/use-projects'
import type { ProjectMetric } from '@/types'
import { Plus, TrendingUp, Target, Trash2, Edit2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface MetricItemProps {
  metric: ProjectMetric
  projectId: string
  color?: string
  onUpdateValue: (id: string, value: number) => void
  onDelete: (id: string) => void
}

function MetricItem({ metric, projectId, color, onUpdateValue, onDelete }: MetricItemProps) {
  const t = useTranslations('projects')
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(metric.currentValue.toString())

  const hasTarget = metric.targetValue !== undefined && metric.targetValue > 0
  const progress = hasTarget ? Math.min(100, (metric.currentValue / metric.targetValue!) * 100) : 0
  const isComplete = hasTarget && metric.currentValue >= metric.targetValue!

  const handleSaveValue = () => {
    const newValue = parseFloat(editValue)
    if (isNaN(newValue)) return
    onUpdateValue(metric.id, newValue)
    setIsEditing(false)
  }

  const formatValue = (value: number): string => {
    if (Number.isInteger(value)) return value.toString()
    return value.toFixed(2)
  }

  return (
    <Card className="group relative">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${color}20` }}
            >
              {hasTarget ? (
                <Target className="h-4 w-4" style={{ color }} />
              ) : (
                <TrendingUp className="h-4 w-4" style={{ color }} />
              )}
            </div>
            <CardTitle className="text-sm">{metric.name}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100"
            onClick={() => onDelete(metric.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="h-9"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveValue()
                if (e.key === 'Escape') {
                  setIsEditing(false)
                  setEditValue(metric.currentValue.toString())
                }
              }}
            />
            <Button size="sm" onClick={handleSaveValue}>
              {t('save')}
            </Button>
          </div>
        ) : (
          <button
            className="flex items-center gap-1 group/value"
            onClick={() => {
              setEditValue(metric.currentValue.toString())
              setIsEditing(true)
            }}
          >
            <span className={cn('text-2xl font-bold', isComplete && 'text-green-600')}>
              {formatValue(metric.currentValue)}
            </span>
            {metric.unit && <span className="text-sm text-muted-foreground">{metric.unit}</span>}
            <Edit2 className="h-3 w-3 opacity-0 group-hover/value:opacity-50 ml-1" />
          </button>
        )}

        {hasTarget && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t('goal')}</span>
              <span>
                {formatValue(metric.targetValue!)} {metric.unit}
              </span>
            </div>
            <Progress
              value={progress}
              className={cn('h-2', isComplete && 'bg-green-200')}
              style={isComplete ? undefined : { accentColor: color }}
            />
            <p className="text-xs text-muted-foreground text-right">
              {Math.round(progress)}% {t('complete')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface MetricGridProps {
  projectId: string
  color?: string
}

export function MetricGrid({ projectId, color }: MetricGridProps) {
  const t = useTranslations('projects')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('')
  const [targetValue, setTargetValue] = useState('')
  const [currentValue, setCurrentValue] = useState('0')

  const { data: metrics = [], isLoading } = useProjectMetricsByProject(projectId)
  const createMetricMutation = useCreateProjectMetric()
  const updateValueMutation = useUpdateProjectMetricValue()
  const deleteMetricMutation = useDeleteProjectMetric()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    try {
      await createMetricMutation.mutateAsync({
        projectId,
        name: name.trim(),
        unit: unit.trim() || undefined,
        targetValue: targetValue ? parseFloat(targetValue) : undefined,
        currentValue: currentValue ? parseFloat(currentValue) : 0,
      })
      setName('')
      setUnit('')
      setTargetValue('')
      setCurrentValue('0')
      setDialogOpen(false)
      toast.success(t('metricCreated'))
    } catch (error) {
      toast.error(t('metricCreateError'))
    }
  }

  const handleUpdateValue = async (id: string, value: number) => {
    try {
      await updateValueMutation.mutateAsync({ id, value, projectId })
      toast.success(t('metricUpdated'))
    } catch (error) {
      toast.error(t('metricUpdateError'))
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMetricMutation.mutateAsync({ id, projectId })
      toast.success(t('metricDeleted'))
    } catch (error) {
      toast.error(t('metricDeleteError'))
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{t('metrics')}</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="mr-1 h-4 w-4" />
              {t('addMetric')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('addMetric')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metric-name">{t('metricName')}</Label>
                <Input
                  id="metric-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('metricNamePlaceholder')}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="metric-unit">{t('metricUnit')}</Label>
                  <Input
                    id="metric-unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder={t('metricUnitPlaceholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metric-current">{t('currentValue')}</Label>
                  <Input
                    id="metric-current"
                    type="number"
                    step="any"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="metric-target">
                  {t('targetValue')} <span className="text-muted-foreground">({t('optional')})</span>
                </Label>
                <Input
                  id="metric-target"
                  type="number"
                  step="any"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder={t('metricTargetPlaceholder')}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button type="submit" disabled={createMetricMutation.isPending}>
                  {t('create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {metrics.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
          <TrendingUp className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p>{t('noMetrics')}</p>
          <Button variant="link" className="mt-2" onClick={() => setDialogOpen(true)}>
            {t('addFirstMetric')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric) => (
            <MetricItem
              key={metric.id}
              metric={metric}
              projectId={projectId}
              color={color}
              onUpdateValue={handleUpdateValue}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
