'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageTransition, CountUp } from '@/components/ui/motion'
import { useUserStats, useAchievements } from '@/hooks/queries/use-gamification'
import { useSettingsStore } from '@/stores/settings'
import {
  ACHIEVEMENT_DEFINITIONS,
  RARITY_COLORS,
  getAchievementDefinition,
  type AchievementRarity,
} from '@/config/achievements'
import { Trophy, Lock, Star, Flame, Sparkles } from 'lucide-react'
import type { Achievement } from '@/types'

function formatDate(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

interface AchievementCardProps {
  definition: (typeof ACHIEVEMENT_DEFINITIONS)[number]
  unlocked?: Achievement
  progress?: { current: number; target: number }
  locale: string
}

function AchievementCard({ definition, unlocked, progress, locale }: AchievementCardProps) {
  const t = useTranslations('achievements')
  const IconComponent = definition.icon
  const isUnlocked = !!unlocked
  const rarityColor = RARITY_COLORS[definition.rarity]

  return (
    <Card
      className={`relative overflow-hidden transition-all ${
        isUnlocked
          ? 'bg-gradient-to-br from-background to-muted/50'
          : 'opacity-60 grayscale hover:opacity-80 hover:grayscale-0'
      }`}
    >
      {/* Rarity indicator */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ backgroundColor: rarityColor }}
      />

      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl ${
              isUnlocked ? '' : 'bg-muted'
            }`}
            style={
              isUnlocked
                ? { backgroundColor: `${definition.color}20`, color: definition.color }
                : {}
            }
          >
            {isUnlocked ? (
              <IconComponent className="h-7 w-7" />
            ) : (
              <Lock className="h-6 w-6 text-muted-foreground" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{t(definition.titleKey)}</h3>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${rarityColor}20`,
                  color: rarityColor,
                }}
              >
                {t(definition.rarity)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t(definition.descriptionKey)}
            </p>

            {/* Progress or unlock date */}
            {isUnlocked ? (
              <p className="text-xs text-muted-foreground mt-2">
                {t('unlockedAt')} {formatDate(unlocked.unlockedAt, locale)}
              </p>
            ) : progress && progress.target > 0 ? (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>{t('progress')}</span>
                  <span>
                    {progress.current}/{progress.target}
                  </span>
                </div>
                <Progress
                  value={Math.min(100, (progress.current / progress.target) * 100)}
                  className="h-1.5"
                />
              </div>
            ) : null}
          </div>

          {/* XP Reward */}
          <div className="flex flex-col items-end">
            <span
              className={`text-sm font-medium ${
                isUnlocked ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              +{definition.xpReward} XP
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AchievementsPage() {
  const t = useTranslations('achievements')
  const [mounted, setMounted] = useState(false)

  const locale = useSettingsStore((state) => state.locale)
  const { data: userStats } = useUserStats()
  const { data: achievements = [] } = useAchievements()

  const habitsCompleted = userStats?.habitsCompleted ?? 0
  const tasksCompleted = userStats?.tasksCompleted ?? 0
  const currentStreak = userStats?.currentStreak ?? 0
  const level = userStats?.level ?? 1

  useEffect(() => {
    setMounted(true)
  }, [])

  const { unlockedAchievements, lockedAchievements, totalXpEarned, stats } = useMemo(() => {
    const unlocked: { definition: (typeof ACHIEVEMENT_DEFINITIONS)[number]; achievement: Achievement }[] = []
    const locked: { definition: (typeof ACHIEVEMENT_DEFINITIONS)[number]; progress?: { current: number; target: number } }[] = []
    let totalXp = 0

    for (const def of ACHIEVEMENT_DEFINITIONS) {
      const achievement = achievements.find((a) => a.type === def.type)

      if (achievement) {
        unlocked.push({ definition: def, achievement })
        totalXp += def.xpReward
      } else {
        // Calculate progress for locked achievements
        let progress: { current: number; target: number } | undefined

        switch (def.requirement.type) {
          case 'habits_completed':
            progress = { current: habitsCompleted, target: def.requirement.value || 0 }
            break
          case 'tasks_completed':
            progress = { current: tasksCompleted, target: def.requirement.value || 0 }
            break
          case 'streak':
            progress = { current: currentStreak, target: def.requirement.value || 0 }
            break
          case 'level':
            progress = { current: level, target: def.requirement.value || 0 }
            break
        }

        locked.push({ definition: def, progress })
      }
    }

    // Sort unlocked by date (most recent first)
    unlocked.sort(
      (a, b) =>
        new Date(b.achievement.unlockedAt).getTime() -
        new Date(a.achievement.unlockedAt).getTime()
    )

    // Sort locked by progress (closest to completion first)
    locked.sort((a, b) => {
      const progressA = a.progress ? a.progress.current / a.progress.target : 0
      const progressB = b.progress ? b.progress.current / b.progress.target : 0
      return progressB - progressA
    })

    return {
      unlockedAchievements: unlocked,
      lockedAchievements: locked,
      totalXpEarned: totalXp,
      stats: {
        unlocked: unlocked.length,
        total: ACHIEVEMENT_DEFINITIONS.length,
        percentage: Math.round((unlocked.length / ACHIEVEMENT_DEFINITIONS.length) * 100),
      },
    }
  }, [achievements, habitsCompleted, tasksCompleted, currentStreak, level])

  if (!mounted) {
    return (
      <div className="container mx-auto max-w-md space-y-6 p-4 lg:max-w-4xl lg:p-6">
        <div className="h-10 w-40 animate-pulse rounded-lg bg-muted" />
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
      </div>
    )
  }

  return (
    <PageTransition className="container mx-auto max-w-md space-y-6 p-4 lg:max-w-4xl lg:p-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </header>

      {/* Stats Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
        <CardContent className="p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center gap-1">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <CountUp
                  to={stats.unlocked}
                  className="text-3xl font-bold"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {t('unlocked')}
              </p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1">
                <Sparkles className="h-5 w-5 text-primary" />
                <CountUp
                  to={totalXpEarned}
                  className="text-3xl font-bold"
                />
              </div>
              <p className="text-sm text-muted-foreground">XP</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1">
                <Star className="h-5 w-5 text-orange-500" />
                <CountUp
                  to={stats.percentage}
                  className="text-3xl font-bold"
                />
                <span className="text-3xl font-bold">%</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('progress')}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={stats.percentage} className="h-2" />
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {stats.unlocked} / {stats.total} {t('title').toLowerCase()}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Achievement Tabs */}
      <Tabs defaultValue="unlocked" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="unlocked" className="gap-2">
            <Trophy className="h-4 w-4" />
            {t('unlocked')} ({unlockedAchievements.length})
          </TabsTrigger>
          <TabsTrigger value="locked" className="gap-2">
            <Lock className="h-4 w-4" />
            {t('locked')} ({lockedAchievements.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unlocked" className="mt-4 space-y-3">
          {unlockedAchievements.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                  Complete hábitos e tarefas para desbloquear conquistas!
                </p>
              </CardContent>
            </Card>
          ) : (
            unlockedAchievements.map(({ definition, achievement }) => (
              <AchievementCard
                key={definition.type}
                definition={definition}
                unlocked={achievement}
                locale={locale}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="locked" className="mt-4 space-y-3">
          {lockedAchievements.map(({ definition, progress }) => (
            <AchievementCard
              key={definition.type}
              definition={definition}
              progress={progress}
              locale={locale}
            />
          ))}
        </TabsContent>
      </Tabs>
    </PageTransition>
  )
}
