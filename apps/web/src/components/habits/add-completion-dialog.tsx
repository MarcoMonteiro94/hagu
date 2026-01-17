'use client'

import { useState } from 'react'
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
import { useSetCompletionValue } from '@/hooks/queries/use-habits'
import { useSettingsStore } from '@/stores/settings'
import type { Habit } from '@/types'
import { CalendarPlus, Check } from 'lucide-react'
import { toast } from 'sonner'

interface AddCompletionDialogProps {
  habit: Habit
  children?: React.ReactNode
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

function formatDateForInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function AddCompletionDialog({ habit, children }: AddCompletionDialogProps) {
  const t = useTranslations('habits')
  const tCommon = useTranslations('common')
  const locale = useSettingsStore((state) => state.locale)

  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(() => {
    // Default to yesterday
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return formatDateForInput(yesterday)
  })
  const [value, setValue] = useState('1')

  const setCompletionMutation = useSetCompletionValue()

  const isQuantitative = habit.tracking.type === 'quantitative'
  const today = getTodayString()

  // Check if there's already a completion for the selected date
  const existingCompletion = habit.completions.find((c) => c.date === date)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (date > today) {
      toast.error(t('cannotLogFuture'))
      return
    }

    const numValue = isQuantitative ? parseFloat(value) : 1

    if (isQuantitative && (isNaN(numValue) || numValue <= 0)) {
      toast.error(t('invalidValue'))
      return
    }

    try {
      await setCompletionMutation.mutateAsync({
        habitId: habit.id,
        date,
        value: numValue,
      })

      toast.success(t('completionAdded'))
      setOpen(false)

      // Reset to yesterday for next use
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      setDate(formatDateForInput(yesterday))
      setValue('1')
    } catch {
      toast.error(t('completionAddError'))
    }
  }

  const formatSelectedDate = (dateStr: string): string => {
    const dateObj = new Date(dateStr + 'T00:00:00')
    return dateObj.toLocaleDateString(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2">
            <CalendarPlus className="h-4 w-4" />
            {t('addPastCompletion')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t('addPastCompletion')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="completion-date">{t('completionDate')}</Label>
            <Input
              id="completion-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={today}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground capitalize">
              {formatSelectedDate(date)}
            </p>
          </div>

          {/* Value Input for Quantitative Habits */}
          {habit.tracking.type === 'quantitative' && (
            <div className="space-y-2">
              <Label htmlFor="completion-value">
                {t('value')} ({habit.tracking.unit})
              </Label>
              <Input
                id="completion-value"
                type="number"
                min="0.01"
                step="any"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={`${habit.tracking.target}`}
              />
              <p className="text-xs text-muted-foreground">
                {t('targetLabel')}: {habit.tracking.target} {habit.tracking.unit}
              </p>
            </div>
          )}

          {/* Warning if completion exists */}
          {existingCompletion && (
            <div className="rounded-lg bg-yellow-500/10 p-3 text-sm text-yellow-600 dark:text-yellow-500">
              {t('existingCompletionWarning', {
                value: habit.tracking.type === 'quantitative'
                  ? `${existingCompletion.value} ${habit.tracking.unit}`
                  : ''
              })}
            </div>
          )}

          <Button
            type="submit"
            className="w-full gap-2"
            disabled={setCompletionMutation.isPending}
          >
            <Check className="h-4 w-4" />
            {setCompletionMutation.isPending
              ? tCommon('saving')
              : existingCompletion
                ? t('updateCompletion')
                : t('addCompletion')
            }
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
