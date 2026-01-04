'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useSettings, useUpdateHealthGoals } from '@/hooks/queries/use-settings'
import { Target, Check } from 'lucide-react'
import { toast } from 'sonner'

interface WeightGoalDialogProps {
  children?: React.ReactNode
}

export function WeightGoalDialog({ children }: WeightGoalDialogProps) {
  const t = useTranslations('health')
  const tCommon = useTranslations('common')

  const { data: settings } = useSettings()
  const updateHealthGoals = useUpdateHealthGoals()

  const [open, setOpen] = useState(false)
  const [target, setTarget] = useState('')
  const [unit, setUnit] = useState('kg')

  // Initialize form with existing goal data when dialog opens
  useEffect(() => {
    if (open && settings?.healthGoals?.weight) {
      setTarget(settings.healthGoals.weight.target.toString())
      setUnit(settings.healthGoals.weight.unit || 'kg')
    }
  }, [open, settings?.healthGoals?.weight])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const targetNum = parseFloat(target)

    if (isNaN(targetNum) || targetNum <= 0) {
      toast.error(t('invalidWeightGoal'))
      return
    }

    try {
      await updateHealthGoals.mutateAsync({
        weight: {
          target: targetNum,
          unit,
          startDate: new Date().toISOString().split('T')[0],
        },
      })

      toast.success(t('weightGoalSaved'))
      setOpen(false)
    } catch {
      toast.error(t('weightGoalError'))
    }
  }

  const handleRemoveGoal = async () => {
    try {
      await updateHealthGoals.mutateAsync({
        weight: undefined,
      })

      toast.success(t('weightGoalRemoved'))
      setOpen(false)
      setTarget('')
    } catch {
      toast.error(t('weightGoalError'))
    }
  }

  const hasExistingGoal = !!settings?.healthGoals?.weight?.target

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2">
            <Target className="h-4 w-4" />
            {t('setWeightGoal')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('weightGoal')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="weight-target">{t('targetWeight')}</Label>
            <div className="flex gap-2">
              <Input
                id="weight-target"
                type="number"
                min="1"
                step="0.1"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="70"
                className="flex-1"
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="kg">kg</option>
                <option value="lb">lb</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              className="flex-1 gap-2"
              disabled={updateHealthGoals.isPending}
            >
              <Check className="h-4 w-4" />
              {updateHealthGoals.isPending ? tCommon('saving') : tCommon('save')}
            </Button>

            {hasExistingGoal && (
              <Button
                type="button"
                variant="outline"
                onClick={handleRemoveGoal}
                disabled={updateHealthGoals.isPending}
              >
                {t('removeGoal')}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
