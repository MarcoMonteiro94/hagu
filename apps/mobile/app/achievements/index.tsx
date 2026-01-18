import { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  RefreshControl,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { Stack } from 'expo-router'
import {
  Trophy,
  Lock,
  Star,
  Zap,
  X,
  Target,
  Flame,
  CheckCircle2,
  Award,
  Calendar,
  Sparkles,
} from 'lucide-react-native'
import Animated, { FadeInDown, FadeIn, ZoomIn } from 'react-native-reanimated'
import { useTheme, cardShadow, spacing, radius, typography } from '@/theme'
import {
  useAchievements,
  useUnlockedAchievementsCount,
  useUserStats,
  ACHIEVEMENT_TYPES,
} from '@/hooks'

type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary'

interface AchievementItem {
  id: string
  type: string
  name: string
  description: string
  xpReward: number
  rarity: AchievementRarity
  unlockedAt?: string
  progress?: number
  target?: number
}

const RARITY_COLORS: Record<AchievementRarity, string> = {
  common: '#9ca3af',
  rare: '#3b82f6',
  epic: '#8b5cf6',
  legendary: '#eab308',
}

const ACHIEVEMENT_ICONS: Record<string, React.ReactNode> = {
  first_habit: <Target size={24} color="#22c55e" />,
  first_task: <CheckCircle2 size={24} color="#3b82f6" />,
  streak_3: <Flame size={24} color="#f97316" />,
  streak_7: <Flame size={24} color="#ef4444" />,
  streak_30: <Flame size={24} color="#dc2626" />,
  streak_100: <Flame size={24} color="#b91c1c" />,
  habits_10: <Target size={24} color="#22c55e" />,
  habits_50: <Target size={24} color="#16a34a" />,
  habits_100: <Target size={24} color="#15803d" />,
  habits_500: <Target size={24} color="#166534" />,
  tasks_10: <CheckCircle2 size={24} color="#3b82f6" />,
  tasks_50: <CheckCircle2 size={24} color="#2563eb" />,
  tasks_100: <CheckCircle2 size={24} color="#1d4ed8" />,
  level_5: <Star size={24} color="#eab308" />,
  level_10: <Star size={24} color="#ca8a04" />,
  level_20: <Star size={24} color="#a16207" />,
  perfect_day: <Sparkles size={24} color="#8b5cf6" />,
  perfect_week: <Award size={24} color="#7c3aed" />,
}

function getAchievementRarity(type: string): AchievementRarity {
  if (type.includes('500') || type.includes('100') || type === 'streak_100' || type === 'level_20') {
    return 'legendary'
  }
  if (type.includes('50') || type === 'streak_30' || type === 'level_10' || type === 'perfect_week') {
    return 'epic'
  }
  if (type.includes('10') || type === 'streak_7' || type === 'level_5') {
    return 'rare'
  }
  return 'common'
}

function getAchievementXp(type: string): number {
  const rarity = getAchievementRarity(type)
  switch (rarity) {
    case 'legendary':
      return 200
    case 'epic':
      return 100
    case 'rare':
      return 50
    default:
      return 25
  }
}

interface AchievementCardProps {
  achievement: AchievementItem
  onPress: () => void
  index: number
}

function AchievementCard({ achievement, onPress, index }: AchievementCardProps) {
  const { colors } = useTheme()
  const isUnlocked = !!achievement.unlockedAt
  const rarityColor = RARITY_COLORS[achievement.rarity]

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <Pressable onPress={onPress}>
        <View
          style={[
            styles.achievementCard,
            { backgroundColor: colors.card, borderColor: isUnlocked ? rarityColor : colors.border },
            isUnlocked && { borderWidth: 2 },
            cardShadow,
          ]}
        >
          <View
            style={[
              styles.achievementIcon,
              {
                backgroundColor: isUnlocked ? rarityColor + '20' : colors.muted,
                opacity: isUnlocked ? 1 : 0.5,
              },
            ]}
          >
            {isUnlocked ? (
              ACHIEVEMENT_ICONS[achievement.type] || <Trophy size={24} color={rarityColor} />
            ) : (
              <Lock size={24} color={colors.mutedForeground} />
            )}
          </View>

          <Text
            style={[
              styles.achievementName,
              { color: isUnlocked ? colors.foreground : colors.mutedForeground },
            ]}
            numberOfLines={2}
          >
            {achievement.name}
          </Text>

          {isUnlocked && (
            <View style={[styles.xpBadge, { backgroundColor: rarityColor + '20' }]}>
              <Zap size={12} color={rarityColor} />
              <Text style={[styles.xpBadgeText, { color: rarityColor }]}>
                {achievement.xpReward}
              </Text>
            </View>
          )}

          {!isUnlocked && achievement.progress !== undefined && achievement.target && (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBg, { backgroundColor: colors.muted }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.accent,
                      width: `${Math.min(100, (achievement.progress / achievement.target) * 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
                {achievement.progress}/{achievement.target}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  )
}

interface AchievementDetailModalProps {
  achievement: AchievementItem | null
  visible: boolean
  onClose: () => void
}

function AchievementDetailModal({ achievement, visible, onClose }: AchievementDetailModalProps) {
  const { t } = useTranslation()
  const { colors } = useTheme()

  if (!achievement) return null

  const isUnlocked = !!achievement.unlockedAt
  const rarityColor = RARITY_COLORS[achievement.rarity]

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <Animated.View
          entering={ZoomIn.duration(300)}
          style={[styles.modalContent, { backgroundColor: colors.card }]}
        >
          <Pressable style={styles.modalClose} onPress={onClose}>
            <X size={24} color={colors.mutedForeground} />
          </Pressable>

          <View
            style={[
              styles.modalIcon,
              { backgroundColor: isUnlocked ? rarityColor + '20' : colors.muted },
            ]}
          >
            {isUnlocked ? (
              ACHIEVEMENT_ICONS[achievement.type] || <Trophy size={48} color={rarityColor} />
            ) : (
              <Lock size={48} color={colors.mutedForeground} />
            )}
          </View>

          <Text style={[styles.modalTitle, { color: colors.foreground }]}>{achievement.name}</Text>

          <View style={[styles.rarityBadge, { backgroundColor: rarityColor + '20' }]}>
            <Text style={[styles.rarityText, { color: rarityColor }]}>
              {t(`gamification.achievements.rarity.${achievement.rarity}`)}
            </Text>
          </View>

          <Text style={[styles.modalDescription, { color: colors.mutedForeground }]}>
            {achievement.description}
          </Text>

          {isUnlocked ? (
            <View style={styles.unlockedInfo}>
              <View style={[styles.xpEarned, { backgroundColor: rarityColor + '15' }]}>
                <Zap size={20} color={rarityColor} />
                <Text style={[styles.xpEarnedText, { color: rarityColor }]}>
                  +{achievement.xpReward} XP
                </Text>
              </View>
              <Text style={[styles.unlockedDate, { color: colors.mutedForeground }]}>
                {t('gamification.achievements.unlockedAt', {
                  date: new Date(achievement.unlockedAt!).toLocaleDateString(),
                })}
              </Text>
            </View>
          ) : (
            achievement.progress !== undefined &&
            achievement.target && (
              <View style={styles.modalProgress}>
                <Text style={[styles.modalProgressLabel, { color: colors.mutedForeground }]}>
                  {t('gamification.achievements.progress')}
                </Text>
                <View style={[styles.modalProgressBg, { backgroundColor: colors.muted }]}>
                  <View
                    style={[
                      styles.modalProgressFill,
                      {
                        backgroundColor: colors.accent,
                        width: `${Math.min(100, (achievement.progress / achievement.target) * 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.modalProgressText, { color: colors.foreground }]}>
                  {achievement.progress} / {achievement.target}
                </Text>
              </View>
            )
          )}
        </Animated.View>
      </View>
    </Modal>
  )
}

export default function AchievementsScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementItem | null>(null)
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all')

  const { data: achievements, isLoading, refetch } = useAchievements()
  const { data: userStats } = useUserStats()
  const unlockedCount = useUnlockedAchievementsCount()

  // Build achievements list from types
  const achievementTypes = Object.values(ACHIEVEMENT_TYPES)
  const achievementsList: AchievementItem[] = achievementTypes.map((type) => {
    const unlocked = achievements?.find((a) => a.type === type)
    const rarity = getAchievementRarity(type)

    return {
      id: type,
      type,
      name: t(`gamification.achievements.types.${type}`),
      description: t(`gamification.achievements.descriptions.${type}`),
      xpReward: getAchievementXp(type),
      rarity,
      unlockedAt: unlocked?.unlockedAt,
      progress: getProgressForType(type, userStats),
      target: getTargetForType(type),
    }
  })

  const filteredAchievements = achievementsList.filter((a) => {
    if (filter === 'unlocked') return !!a.unlockedAt
    if (filter === 'locked') return !a.unlockedAt
    return true
  })

  const totalAchievements = achievementsList.length

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen
        options={{
          title: t('gamification.achievements.title'),
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.accent} />
        }
      >
        {/* Header Stats */}
        <Animated.View
          entering={FadeIn.duration(400)}
          style={[styles.headerCard, { backgroundColor: colors.accent }]}
        >
          <Trophy size={40} color="#fff" />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              {t('gamification.achievements.count', {
                unlocked: unlockedCount,
                total: totalAchievements,
              })}
            </Text>
            <Text style={styles.headerSubtitle}>
              {t('gamification.achievements.earnedXp', {
                amount: achievements?.reduce((sum, a) => sum + getAchievementXp(a.type), 0) || 0,
              })}
            </Text>
          </View>
        </Animated.View>

        {/* Filter Tabs */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.filterTabs}>
          {(['all', 'unlocked', 'locked'] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.filterTab,
                {
                  backgroundColor: filter === f ? colors.accent : colors.card,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterTabText,
                  { color: filter === f ? '#fff' : colors.mutedForeground },
                ]}
              >
                {f === 'all' && t('tasks.all')}
                {f === 'unlocked' && t('gamification.achievements.unlocked')}
                {f === 'locked' && t('gamification.achievements.locked')}
              </Text>
            </Pressable>
          ))}
        </Animated.View>

        {/* Achievements Grid */}
        <View style={styles.achievementsGrid}>
          {filteredAchievements.map((achievement, index) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              onPress={() => setSelectedAchievement(achievement)}
              index={index}
            />
          ))}
        </View>
      </ScrollView>

      <AchievementDetailModal
        achievement={selectedAchievement}
        visible={!!selectedAchievement}
        onClose={() => setSelectedAchievement(null)}
      />
    </SafeAreaView>
  )
}

function getProgressForType(
  type: string,
  userStats?: { habitsCompleted?: number; tasksCompleted?: number; level?: number } | null
): number | undefined {
  if (!userStats) return undefined

  if (type.startsWith('habits_')) {
    return userStats.habitsCompleted || 0
  }
  if (type.startsWith('tasks_')) {
    return userStats.tasksCompleted || 0
  }
  if (type.startsWith('level_')) {
    return userStats.level || 1
  }

  return undefined
}

function getTargetForType(type: string): number | undefined {
  const match = type.match(/(\d+)$/)
  if (match) {
    return parseInt(match[1], 10)
  }
  return undefined
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
  },

  // Header Card
  headerCard: {
    marginTop: spacing[4],
    padding: spacing[5],
    borderRadius: radius['2xl'],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: typography.size.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing[1],
  },

  // Filter Tabs
  filterTabs: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[4],
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing[2.5],
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  filterTabText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },

  // Achievements Grid
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: spacing[4],
  },
  achievementCard: {
    width: '48%',
    padding: spacing[4],
    borderRadius: radius.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: spacing[3],
    minHeight: 160,
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  achievementName: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    textAlign: 'center',
    marginBottom: spacing[2],
    lineHeight: typography.size.sm * 1.4,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
  },
  xpBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  progressContainer: {
    width: '100%',
    gap: spacing[1],
  },
  progressBg: {
    height: 4,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  progressText: {
    fontSize: typography.size.xs,
    textAlign: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '85%',
    padding: spacing[6],
    borderRadius: radius['2xl'],
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: spacing[4],
    right: spacing[4],
  },
  modalIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  modalTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  rarityBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
    marginBottom: spacing[3],
  },
  rarityText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    textTransform: 'uppercase',
  },
  modalDescription: {
    fontSize: typography.size.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing[4],
  },
  unlockedInfo: {
    alignItems: 'center',
    gap: spacing[2],
  },
  xpEarned: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.lg,
  },
  xpEarnedText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  unlockedDate: {
    fontSize: typography.size.xs,
  },
  modalProgress: {
    width: '100%',
    gap: spacing[2],
  },
  modalProgressLabel: {
    fontSize: typography.size.sm,
    textAlign: 'center',
  },
  modalProgressBg: {
    height: 8,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  modalProgressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  modalProgressText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    textAlign: 'center',
  },
})
