'use client'

import { useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { useFinancesStore } from '@/stores/finances'
import { Plus, Target } from 'lucide-react'

const GOAL_COLORS = [
  '#22c55e', // green
  '#3b82f6', // blue
  '#a855f7', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#ef4444', // red
  '#8b5cf6', // violet
]

interface GoalFormProps {
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function GoalForm({ trigger, onSuccess }: GoalFormProps) {
  const t = useTranslations()
  const { addGoal, currency } = useFinancesStore()

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [deadline, setDeadline] = useState('')
  const [color, setColor] = useState(GOAL_COLORS[0])

  function resetForm() {
    setName('')
    setDescription('')
    setTargetAmount('')
    setDeadline('')
    setColor(GOAL_COLORS[0])
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const numericAmount = parseFloat(targetAmount.replace(',', '.'))
    if (isNaN(numericAmount) || numericAmount <= 0) return
    if (!name.trim()) return

    addGoal({
      name: name.trim(),
      description: description.trim() || undefined,
      targetAmount: numericAmount,
      deadline: deadline || undefined,
      color,
    })

    resetForm()
    setOpen(false)
    onSuccess?.()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            {t('finances.goals.add')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {t('finances.goals.add')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="goalName">{t('finances.goals.name')}</Label>
            <Input
              id="goalName"
              placeholder={t('finances.goals.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="goalDescription">{t('finances.goals.description')}</Label>
            <Textarea
              id="goalDescription"
              placeholder={t('finances.goals.descriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Target Amount */}
          <div className="space-y-2">
            <Label htmlFor="targetAmount">{t('finances.goals.targetAmount')}</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {currency === 'BRL' ? 'R$' : currency === 'USD' ? '$' : '€'}
              </span>
              <Input
                id="targetAmount"
                type="text"
                inputMode="decimal"
                placeholder="10.000,00"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label htmlFor="deadline">{t('finances.goals.deadline')}</Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>{t('finances.goals.color')}</Label>
            <div className="flex flex-wrap gap-2">
              {GOAL_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full transition-transform ${
                    color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full">
            {t('finances.goals.create')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
