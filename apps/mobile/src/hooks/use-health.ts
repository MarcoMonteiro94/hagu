import { useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  areasService,
  metricsService,
  userStatsService,
  achievementsService,
  habitStreaksService,
  getXpForLevel,
  getXpForNextLevel,
  getXpProgress,
  ACHIEVEMENT_TYPES,
} from '@hagu/core'
import type {
  LifeArea,
  MetricEntry,
  UserStats,
  Achievement,
  StreakData,
  WeightGoal,
  HealthGoals,
} from '@hagu/core'

// Query keys
const QUERY_KEYS = {
  areas: ['areas'] as const,
  healthArea: ['areas', 'health'] as const,
  metrics: (areaId: string) => ['metrics', areaId] as const,
  metricsByType: (areaId: string, type: string) => ['metrics', areaId, type] as const,
  userStats: ['userStats'] as const,
  achievements: ['achievements'] as const,
  streaks: ['streaks'] as const,
}

// Types
export type MetricType = 'weight' | 'mood' | 'energy' | 'sleep' | 'water'

export interface MetricConfig {
  type: MetricType
  unit: string
  min: number
  max: number
  step: number
  color: string
}

export const METRIC_CONFIGS: MetricConfig[] = [
  { type: 'weight', unit: 'kg', min: 30, max: 200, step: 0.1, color: '#22c55e' },
  { type: 'mood', unit: '', min: 1, max: 5, step: 1, color: '#eab308' },
  { type: 'energy', unit: '', min: 1, max: 5, step: 1, color: '#f97316' },
  { type: 'sleep', unit: 'h', min: 0, max: 14, step: 0.5, color: '#8b5cf6' },
  { type: 'water', unit: 'L', min: 0, max: 5, step: 0.25, color: '#3b82f6' },
]

export const MOOD_LABELS = ['', 'Muito mal', 'Mal', 'Neutro', 'Bem', 'Muito bem']
export const ENERGY_LABELS = ['', 'Exausto', 'Cansado', 'Normal', 'Energizado', 'Muito energizado']

// Helper functions
function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

// ============ Areas Hooks ============

export function useAreasQuery() {
  return useQuery({
    queryKey: QUERY_KEYS.areas,
    queryFn: async () => {
      const areas = await areasService.getAll(supabase)
      return areas
    },
  })
}

export function useHealthArea() {
  return useQuery({
    queryKey: QUERY_KEYS.healthArea,
    queryFn: async () => {
      const area = await areasService.getBySlug(supabase, 'health')
      return area
    },
  })
}

// ============ Metrics Hooks ============

export function useMetricsByArea(areaId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.metrics(areaId ?? ''),
    queryFn: async () => {
      if (!areaId) return []
      return metricsService.getByArea(supabase, areaId)
    },
    enabled: !!areaId,
  })
}

export function useMetricsByType(areaId: string | undefined, type: MetricType) {
  return useQuery({
    queryKey: QUERY_KEYS.metricsByType(areaId ?? '', type),
    queryFn: async () => {
      if (!areaId) return []
      return metricsService.getByAreaAndType(supabase, areaId, type)
    },
    enabled: !!areaId,
  })
}

export interface CreateMetricData {
  areaId: string
  type: MetricType
  value: number
  unit?: string
  date: string
}

export function useCreateMetric() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateMetricData) => {
      return metricsService.create(supabase, data)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.metrics(variables.areaId) })
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.metricsByType(variables.areaId, variables.type),
      })
    },
  })
}

export function useUpdateMetric() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      areaId,
      updates,
    }: {
      id: string
      areaId: string
      updates: Partial<Omit<MetricEntry, 'id' | 'createdAt'>>
    }) => {
      return metricsService.update(supabase, id, updates)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.metrics(variables.areaId) })
    },
  })
}

export function useDeleteMetric() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, areaId }: { id: string; areaId: string }) => {
      return metricsService.delete(supabase, id)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.metrics(variables.areaId) })
    },
  })
}

// ============ Gamification Hooks ============

export function useUserStats() {
  return useQuery({
    queryKey: QUERY_KEYS.userStats,
    queryFn: async () => {
      return userStatsService.get(supabase)
    },
  })
}

export function useAchievements() {
  return useQuery({
    queryKey: QUERY_KEYS.achievements,
    queryFn: async () => {
      return achievementsService.getAll(supabase)
    },
  })
}

export function useHabitStreaks() {
  return useQuery({
    queryKey: QUERY_KEYS.streaks,
    queryFn: async () => {
      return habitStreaksService.getAll(supabase)
    },
  })
}

export function useUnlockAchievement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      type,
      data,
    }: {
      type: string
      data?: Record<string, unknown>
    }) => {
      return achievementsService.unlock(supabase, type, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.achievements })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userStats })
    },
  })
}

export function useAddXp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (amount: number) => {
      return userStatsService.addXp(supabase, amount)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userStats })
    },
  })
}

// ============ Derived Hooks ============

export function useLevel() {
  const { data: stats } = useUserStats()
  return stats?.level ?? 1
}

export function useXpProgress() {
  const { data: stats } = useUserStats()

  return useMemo(() => {
    const totalXp = stats?.totalXp ?? 0
    const level = stats?.level ?? 1

    return {
      totalXp,
      level,
      currentLevelXp: getXpForLevel(level),
      nextLevelXp: getXpForNextLevel(level),
      progress: getXpProgress(totalXp, level),
      xpToNext: getXpForNextLevel(level) - totalXp,
    }
  }, [stats])
}

export function useGlobalStreak() {
  const { data: stats } = useUserStats()

  return {
    currentStreak: stats?.currentStreak ?? 0,
    longestStreak: stats?.longestStreak ?? 0,
  }
}

export function useUnlockedAchievementsCount() {
  const { data: achievements } = useAchievements()
  return achievements?.length ?? 0
}

// ============ Health-specific computed values ============

export interface WeightStats {
  current: number | null
  goal: number | null
  remaining: number | null
  lowest: number | null
  highest: number | null
  variation7d: number | null
  trend: 'up' | 'down' | 'stable' | null
}

export function useWeightStats(metrics: MetricEntry[] | undefined, weightGoal?: WeightGoal) {
  return useMemo<WeightStats>(() => {
    if (!metrics || metrics.length === 0) {
      return {
        current: null,
        goal: weightGoal?.target ?? null,
        remaining: null,
        lowest: null,
        highest: null,
        variation7d: null,
        trend: null,
      }
    }

    const sortedMetrics = [...metrics].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    const current = sortedMetrics[sortedMetrics.length - 1].value
    const goal = weightGoal?.target ?? null
    const remaining = goal !== null ? current - goal : null

    const values = sortedMetrics.map((m) => m.value)
    const lowest = Math.min(...values)
    const highest = Math.max(...values)

    // Calculate 7-day variation
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

    const recentMetrics = sortedMetrics.filter((m) => m.date >= sevenDaysAgoStr)
    let variation7d: number | null = null
    let trend: 'up' | 'down' | 'stable' | null = null

    if (recentMetrics.length >= 2) {
      const firstRecent = recentMetrics[0].value
      const lastRecent = recentMetrics[recentMetrics.length - 1].value
      variation7d = lastRecent - firstRecent

      if (variation7d > 0.1) trend = 'up'
      else if (variation7d < -0.1) trend = 'down'
      else trend = 'stable'
    }

    return { current, goal, remaining, lowest, highest, variation7d, trend }
  }, [metrics, weightGoal])
}

export function useMetricTrend(metrics: MetricEntry[] | undefined) {
  return useMemo(() => {
    if (!metrics || metrics.length < 2) return 'neutral'

    const sortedMetrics = [...metrics].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    const latest = sortedMetrics[sortedMetrics.length - 1]
    const previous = sortedMetrics[sortedMetrics.length - 2]

    if (latest.value > previous.value) return 'up'
    if (latest.value < previous.value) return 'down'
    return 'neutral'
  }, [metrics])
}

export function useLatestMetric(metrics: MetricEntry[] | undefined) {
  return useMemo(() => {
    if (!metrics || metrics.length === 0) return null

    const sortedMetrics = [...metrics].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    return sortedMetrics[sortedMetrics.length - 1]
  }, [metrics])
}

// Re-export types and constants
export type { LifeArea, MetricEntry, UserStats, Achievement, StreakData, WeightGoal, HealthGoals }
export { ACHIEVEMENT_TYPES, getXpForLevel, getXpForNextLevel, getXpProgress }
