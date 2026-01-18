'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GoalForm } from './goal-form'
import { GoalCard } from './goal-card'
import { useFinancialGoals } from '@/hooks/queries/use-finances'
import { Target, Loader2 } from 'lucide-react'

export function GoalsSection() {
  const t = useTranslations()
  const { data: goals = [], isLoading } = useFinancialGoals()

  // Sort: incomplete first, then by creation date
  const sortedGoals = [...goals].sort((a, b) => {
    if (a.completedAt && !b.completedAt) return 1
    if (!a.completedAt && b.completedAt) return -1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const activeGoals = goals.filter((g) => !g.completedAt)
  const completedGoals = goals.filter((g) => g.completedAt)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-5 w-5" />
          {t('finances.goals.title')}
        </CardTitle>
        <GoalForm />
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="py-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : goals.length === 0 ? (
          <div className="py-8 text-center">
            <Target className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              {t('finances.goals.empty')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('finances.goals.emptyHint')}
            </p>
          </div>
        ) : (
          <>
            {/* Active Goals */}
            {activeGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
              <div className="pt-4">
                <p className="mb-3 text-sm font-medium text-muted-foreground">
                  {t('finances.goals.completedCount', { count: completedGoals.length })}
                </p>
                {completedGoals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
