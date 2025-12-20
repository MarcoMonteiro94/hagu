'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCreateHabit, useUpdateHabit } from '@/hooks/queries/use-habits'
import { useOrderedAreas } from '@/hooks/queries/use-areas'
import type { Habit, HabitFrequency, HabitTracking } from '@/types'
import { Plus, Check, Edit } from 'lucide-react'
import { toast } from 'sonner'
import { PICKER_COLORS, getColorName } from '@/config/colors'

const DAYS_OF_WEEK = [0, 1, 2, 3, 4, 5, 6] // Sun-Sat

function getInitialFrequencyType(habit?: Habit): 'daily' | 'weekly' | 'specificDays' | 'monthly' {
  return habit?.frequency.type || 'daily'
}

function getInitialDaysPerWeek(habit?: Habit): number {
  return habit?.frequency.type === 'weekly' ? habit.frequency.daysPerWeek : 3
}

function getInitialSpecificDays(habit?: Habit): number[] {
  return habit?.frequency.type === 'specificDays' ? habit.frequency.days : [1, 3, 5]
}

function getInitialTimesPerMonth(habit?: Habit): number {
  return habit?.frequency.type === 'monthly' ? habit.frequency.timesPerMonth : 10
}

function getInitialTarget(habit?: Habit): number {
  return habit?.tracking.type === 'quantitative' ? habit.tracking.target : 1
}

function getInitialUnit(habit?: Habit): string {
  return habit?.tracking.type === 'quantitative' ? habit.tracking.unit : ''
}

interface HabitFormDialogProps {
  children?: React.ReactNode
  habit?: Habit // If provided, edit mode
  defaultAreaId?: string // Pre-select area when creating
  onClose?: () => void
}

export function HabitFormDialog({ children, habit, defaultAreaId: propDefaultAreaId, onClose }: HabitFormDialogProps) {
  const t = useTranslations('habits')
  const tDays = useTranslations('days')
  const tCommon = useTranslations('common')

  const createHabitMutation = useCreateHabit()
  const updateHabitMutation = useUpdateHabit()
  const { data: areas = [] } = useOrderedAreas()

  const isEditing = !!habit
  const defaultAreaId = propDefaultAreaId || areas[0]?.id || ''

  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(habit?.title || '')
  const [description, setDescription] = useState(habit?.description || '')
  const [areaId, setAreaId] = useState(habit?.areaId || defaultAreaId)
  const [color, setColor] = useState(habit?.color || PICKER_COLORS[3])

  // Update areaId when areas first load if we started with empty value
  useEffect(() => {
    if (areas.length > 0 && !areaId) {
      setAreaId(areas[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areas])

  // Frequency state
  const [frequencyType, setFrequencyType] = useState<'daily' | 'weekly' | 'specificDays' | 'monthly'>(getInitialFrequencyType(habit))
  const [daysPerWeek, setDaysPerWeek] = useState(getInitialDaysPerWeek(habit))
  const [specificDays, setSpecificDays] = useState<number[]>(getInitialSpecificDays(habit))
  const [timesPerMonth, setTimesPerMonth] = useState(getInitialTimesPerMonth(habit))

  // Tracking state
  const [trackingType, setTrackingType] = useState<'boolean' | 'quantitative'>(habit?.tracking.type || 'boolean')
  const [target, setTarget] = useState(getInitialTarget(habit))
  const [unit, setUnit] = useState(getInitialUnit(habit))

  const resetForm = () => {
    if (habit) {
      // Reset to habit values for edit mode
      setTitle(habit.title)
      setDescription(habit.description || '')
      setAreaId(habit.areaId)
      setColor(habit.color)
      setFrequencyType(getInitialFrequencyType(habit))
      setDaysPerWeek(getInitialDaysPerWeek(habit))
      setSpecificDays(getInitialSpecificDays(habit))
      setTimesPerMonth(getInitialTimesPerMonth(habit))
      setTrackingType(habit.tracking.type)
      setTarget(getInitialTarget(habit))
      setUnit(getInitialUnit(habit))
    } else {
      // Reset to defaults for create mode
      setTitle('')
      setDescription('')
      setAreaId(defaultAreaId)
      setColor(PICKER_COLORS[3])
      setFrequencyType('daily')
      setDaysPerWeek(3)
      setSpecificDays([1, 3, 5])
      setTimesPerMonth(10)
      setTrackingType('boolean')
      setTarget(1)
      setUnit('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return
    if (!areaId || !areas.some((a) => a.id === areaId)) return

    let frequency: HabitFrequency
    switch (frequencyType) {
      case 'daily':
        frequency = { type: 'daily' }
        break
      case 'weekly':
        frequency = { type: 'weekly', daysPerWeek }
        break
      case 'specificDays':
        frequency = { type: 'specificDays', days: specificDays }
        break
      case 'monthly':
        frequency = { type: 'monthly', timesPerMonth }
        break
    }

    let tracking: HabitTracking
    if (trackingType === 'boolean') {
      tracking = { type: 'boolean' }
    } else {
      tracking = { type: 'quantitative', target, unit }
    }

    try {
      if (isEditing && habit) {
        await updateHabitMutation.mutateAsync({
          id: habit.id,
          updates: {
            title: title.trim(),
            description: description.trim() || undefined,
            areaId,
            frequency,
            tracking,
            color,
          },
        })
      } else {
        await createHabitMutation.mutateAsync({
          title: title.trim(),
          description: description.trim() || undefined,
          areaId,
          frequency,
          tracking,
          color,
        })
      }

      toast.success(isEditing ? t('habitUpdated') : t('habitCreated'))
      resetForm()
      setOpen(false)
      onClose?.()
    } catch (error) {
      const err = error as Error
      console.error('Failed to save habit:', err.message || err)
      toast.error(isEditing ? t('habitUpdateError') : t('habitCreateError'))
    }
  }

  const isSubmitting = createHabitMutation.isPending || updateHabitMutation.isPending

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      onClose?.()
    }
  }

  const toggleSpecificDay = (day: number) => {
    setSpecificDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  const dayLabels = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          isEditing ? (
            <Button variant="outline" size="sm">
              <Edit className="mr-1 h-4 w-4" />
              {tCommon('edit')}
            </Button>
          ) : (
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              {t('addNew')}
            </Button>
          )
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('editHabit') : t('addNew')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t('habitName')}</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('habitName')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('habitDescription')}</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('habitDescription')}
              />
            </div>
          </div>

          {/* Area Selection */}
          <div className="space-y-2">
            <Label>{t('area')}</Label>
            <div className="flex flex-wrap gap-2">
              {areas.map((area) => (
                <Button
                  key={area.id}
                  type="button"
                  variant={areaId === area.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAreaId(area.id)}
                  style={
                    areaId === area.id
                      ? { backgroundColor: area.color, borderColor: area.color }
                      : {}
                  }
                >
                  {area.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label>{t('color')}</Label>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t('color')}>
              {PICKER_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={color === c}
                  aria-label={getColorName(c)}
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                >
                  {color === c && <Check className="h-4 w-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div className="space-y-3">
            <Label>{t('frequency')}</Label>
            <Tabs value={frequencyType} onValueChange={(v) => setFrequencyType(v as typeof frequencyType)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="daily">{t('frequencyDaily')}</TabsTrigger>
                <TabsTrigger value="weekly">{t('frequencyWeekly')}</TabsTrigger>
              </TabsList>
              <TabsList className="mt-1 grid w-full grid-cols-2">
                <TabsTrigger value="specificDays">{t('frequencySpecificDays')}</TabsTrigger>
                <TabsTrigger value="monthly">{t('frequencyMonthly')}</TabsTrigger>
              </TabsList>

              <TabsContent value="daily" className="mt-3">
                <p className="text-sm text-muted-foreground">
                  {t('frequencyDaily')} - todos os dias
                </p>
              </TabsContent>

              <TabsContent value="weekly" className="mt-3 space-y-2">
                <Label>Vezes por semana</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={7}
                    value={daysPerWeek}
                    onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">x por semana</span>
                </div>
              </TabsContent>

              <TabsContent value="specificDays" className="mt-3 space-y-2">
                <Label>Selecione os dias</Label>
                <div className="flex gap-1">
                  {DAYS_OF_WEEK.map((day) => (
                    <Button
                      key={day}
                      type="button"
                      variant={specificDays.includes(day) ? 'default' : 'outline'}
                      size="sm"
                      className="h-9 w-9 p-0"
                      onClick={() => toggleSpecificDay(day)}
                    >
                      {tDays(dayLabels[day])[0]}
                    </Button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="monthly" className="mt-3 space-y-2">
                <Label>Vezes por mês</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={timesPerMonth}
                    onChange={(e) => setTimesPerMonth(Number(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">x por mês</span>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Tracking Type */}
          <div className="space-y-3">
            <Label>{t('trackingType')}</Label>
            <Tabs value={trackingType} onValueChange={(v) => setTrackingType(v as typeof trackingType)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="boolean">{t('trackingBoolean')}</TabsTrigger>
                <TabsTrigger value="quantitative">{t('trackingQuantitative')}</TabsTrigger>
              </TabsList>

              <TabsContent value="boolean" className="mt-3">
                <p className="text-sm text-muted-foreground">
                  Marque como feito ou não feito
                </p>
              </TabsContent>

              <TabsContent value="quantitative" className="mt-3 space-y-3">
                <div className="space-y-2">
                  <Label>{t('target')}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={target}
                    onChange={(e) => setTarget(Number(e.target.value))}
                    placeholder="8"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('unit')}</Label>
                  <Input
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="copos, minutos, páginas..."
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Submit */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : isEditing ? tCommon('save') : tCommon('create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
