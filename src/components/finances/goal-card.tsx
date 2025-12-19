'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useFinancesStore } from '@/stores/finances'
import { formatCurrency, formatPercentage } from '@/lib/finances'
import type { FinancialGoal } from '@/types/finances'
import {
  Target,
  Plus,
  MoreHorizontal,
  Trash2,
  Calendar,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface GoalCardProps {
  goal: FinancialGoal
}

export function GoalCard({ goal }: GoalCardProps) {
  const t = useTranslations()
  const { addGoalContribution, deleteGoal, currency } = useFinancesStore()

  const [showContribution, setShowContribution] = useState(false)
  const [contributionAmount, setContributionAmount] = useState('')

  const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
  const remaining = goal.targetAmount - goal.currentAmount
  const isCompleted = goal.completedAt !== undefined

  function handleAddContribution() {
    const amount = parseFloat(contributionAmount.replace(',', '.'))
    if (isNaN(amount) || amount <= 0) return

    addGoalContribution(goal.id, amount)
    setContributionAmount('')
    setShowContribution(false)
  }

  function formatDeadline(deadline: string): string {
    const date = new Date(deadline)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return t('finances.goals.overdue')
    if (diffDays === 0) return t('common.today')
    if (diffDays === 1) return t('common.tomorrow')
    if (diffDays < 30) return t('finances.goals.daysLeft', { count: diffDays })
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      return t('finances.goals.monthsLeft', { count: months })
    }
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
  }

  return (
    <>
      <Card className={cn(isCompleted && 'border-green-500/50 bg-green-500/5')}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            {/* Icon */}
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: `${goal.color}20` }}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Target className="h-5 w-5" style={{ color: goal.color }} />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium truncate">{goal.name}</h3>
                {isCompleted && (
                  <span className="text-xs text-green-500 font-medium">
                    {t('finances.goals.completed')}
                  </span>
                )}
              </div>

              {goal.description && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {goal.description}
                </p>
              )}

              {/* Progress Bar */}
              <div className="mt-3 space-y-1">
                <Progress
                  value={progress}
                  className="h-2"
                  style={{ '--progress-background': goal.color } as React.CSSProperties}
                />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {formatCurrency(goal.currentAmount, currency)} / {formatCurrency(goal.targetAmount, currency)}
                  </span>
                  <span className="font-medium" style={{ color: goal.color }}>
                    {formatPercentage(progress, 0)}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                {goal.deadline && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDeadline(goal.deadline)}
                  </div>
                )}
                {!isCompleted && remaining > 0 && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {t('finances.goals.remaining', {
                      amount: formatCurrency(remaining, currency),
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {!isCompleted && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowContribution(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => deleteGoal(goal.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('common.delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contribution Dialog */}
      <Dialog open={showContribution} onOpenChange={setShowContribution}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('finances.goals.addContribution')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{goal.name}</p>
              <p className="text-lg font-medium">
                {formatCurrency(goal.currentAmount, currency)} / {formatCurrency(goal.targetAmount, currency)}
              </p>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {currency === 'BRL' ? 'R$' : currency === 'USD' ? '$' : '€'}
              </span>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={contributionAmount}
                onChange={(e) => setContributionAmount(e.target.value)}
                className="pl-10 text-lg"
                autoFocus
              />
            </div>
            <Button onClick={handleAddContribution} className="w-full">
              {t('finances.goals.contribute')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
