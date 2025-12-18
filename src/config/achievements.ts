import {
  Flame,
  Target,
  Trophy,
  Star,
  Zap,
  Crown,
  Rocket,
  Medal,
  Award,
  Gem,
  Sparkles,
  CheckCircle2,
  ListTodo,
  Calendar,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface AchievementDefinition {
  type: string
  titleKey: string
  descriptionKey: string
  icon: LucideIcon
  rarity: AchievementRarity
  xpReward: number
  color: string
  requirement: {
    type: 'habits_completed' | 'tasks_completed' | 'streak' | 'level' | 'first_habit' | 'first_task' | 'areas' | 'perfect_day' | 'perfect_week'
    value?: number
  }
}

export const RARITY_COLORS: Record<AchievementRarity, string> = {
  common: '#9ca3af', // gray
  rare: '#3b82f6', // blue
  epic: '#a855f7', // purple
  legendary: '#f59e0b', // amber/gold
}

export const RARITY_LABELS: Record<AchievementRarity, { pt: string; en: string }> = {
  common: { pt: 'Comum', en: 'Common' },
  rare: { pt: 'Raro', en: 'Rare' },
  epic: { pt: 'Épico', en: 'Epic' },
  legendary: { pt: 'Lendário', en: 'Legendary' },
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // First steps
  {
    type: 'first_habit',
    titleKey: 'firstHabit',
    descriptionKey: 'firstHabitDesc',
    icon: Sparkles,
    rarity: 'common',
    xpReward: 25,
    color: '#22c55e',
    requirement: { type: 'first_habit' },
  },
  {
    type: 'first_task',
    titleKey: 'firstTask',
    descriptionKey: 'firstTaskDesc',
    icon: CheckCircle2,
    rarity: 'common',
    xpReward: 25,
    color: '#3b82f6',
    requirement: { type: 'first_task' },
  },

  // Streak achievements
  {
    type: 'streak_3',
    titleKey: 'streak3',
    descriptionKey: 'streak3Desc',
    icon: Flame,
    rarity: 'common',
    xpReward: 30,
    color: '#f97316',
    requirement: { type: 'streak', value: 3 },
  },
  {
    type: 'streak_7',
    titleKey: 'streak7',
    descriptionKey: 'streak7Desc',
    icon: Flame,
    rarity: 'rare',
    xpReward: 75,
    color: '#f97316',
    requirement: { type: 'streak', value: 7 },
  },
  {
    type: 'streak_30',
    titleKey: 'streak30',
    descriptionKey: 'streak30Desc',
    icon: Flame,
    rarity: 'epic',
    xpReward: 200,
    color: '#ef4444',
    requirement: { type: 'streak', value: 30 },
  },
  {
    type: 'streak_100',
    titleKey: 'streak100',
    descriptionKey: 'streak100Desc',
    icon: Crown,
    rarity: 'legendary',
    xpReward: 500,
    color: '#eab308',
    requirement: { type: 'streak', value: 100 },
  },

  // Habits completed
  {
    type: 'habits_10',
    titleKey: 'habits10',
    descriptionKey: 'habits10Desc',
    icon: Target,
    rarity: 'common',
    xpReward: 50,
    color: '#22c55e',
    requirement: { type: 'habits_completed', value: 10 },
  },
  {
    type: 'habits_50',
    titleKey: 'habits50',
    descriptionKey: 'habits50Desc',
    icon: Medal,
    rarity: 'rare',
    xpReward: 150,
    color: '#22c55e',
    requirement: { type: 'habits_completed', value: 50 },
  },
  {
    type: 'habits_100',
    titleKey: 'habits100',
    descriptionKey: 'habits100Desc',
    icon: Trophy,
    rarity: 'epic',
    xpReward: 300,
    color: '#22c55e',
    requirement: { type: 'habits_completed', value: 100 },
  },
  {
    type: 'habits_500',
    titleKey: 'habits500',
    descriptionKey: 'habits500Desc',
    icon: Gem,
    rarity: 'legendary',
    xpReward: 750,
    color: '#22c55e',
    requirement: { type: 'habits_completed', value: 500 },
  },

  // Tasks completed
  {
    type: 'tasks_10',
    titleKey: 'tasks10',
    descriptionKey: 'tasks10Desc',
    icon: ListTodo,
    rarity: 'common',
    xpReward: 50,
    color: '#3b82f6',
    requirement: { type: 'tasks_completed', value: 10 },
  },
  {
    type: 'tasks_50',
    titleKey: 'tasks50',
    descriptionKey: 'tasks50Desc',
    icon: Award,
    rarity: 'rare',
    xpReward: 150,
    color: '#3b82f6',
    requirement: { type: 'tasks_completed', value: 50 },
  },
  {
    type: 'tasks_100',
    titleKey: 'tasks100',
    descriptionKey: 'tasks100Desc',
    icon: Star,
    rarity: 'epic',
    xpReward: 300,
    color: '#3b82f6',
    requirement: { type: 'tasks_completed', value: 100 },
  },

  // Level achievements
  {
    type: 'level_5',
    titleKey: 'level5',
    descriptionKey: 'level5Desc',
    icon: Zap,
    rarity: 'common',
    xpReward: 100,
    color: '#8b5cf6',
    requirement: { type: 'level', value: 5 },
  },
  {
    type: 'level_10',
    titleKey: 'level10',
    descriptionKey: 'level10Desc',
    icon: Rocket,
    rarity: 'rare',
    xpReward: 250,
    color: '#8b5cf6',
    requirement: { type: 'level', value: 10 },
  },
  {
    type: 'level_20',
    titleKey: 'level20',
    descriptionKey: 'level20Desc',
    icon: Crown,
    rarity: 'epic',
    xpReward: 500,
    color: '#8b5cf6',
    requirement: { type: 'level', value: 20 },
  },

  // Special achievements
  {
    type: 'perfect_day',
    titleKey: 'perfectDay',
    descriptionKey: 'perfectDayDesc',
    icon: Calendar,
    rarity: 'rare',
    xpReward: 100,
    color: '#ec4899',
    requirement: { type: 'perfect_day' },
  },
  {
    type: 'perfect_week',
    titleKey: 'perfectWeek',
    descriptionKey: 'perfectWeekDesc',
    icon: Trophy,
    rarity: 'epic',
    xpReward: 300,
    color: '#ec4899',
    requirement: { type: 'perfect_week' },
  },
]

export function getAchievementDefinition(type: string): AchievementDefinition | undefined {
  return ACHIEVEMENT_DEFINITIONS.find((a) => a.type === type)
}

export function getAchievementsByRarity(rarity: AchievementRarity): AchievementDefinition[] {
  return ACHIEVEMENT_DEFINITIONS.filter((a) => a.rarity === rarity)
}
