import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { Stack } from 'expo-router'
import {
  Target,
  CheckCircle2,
  Flame,
  TrendingUp,
  Clock,
  BarChart3,
  Zap,
  Trophy,
  Calendar,
} from 'lucide-react-native'
import { useTheme, cardShadow, spacing, radius, typography } from '@/theme'
import {
  useUserStats,
  useLevel,
  useXpProgress,
  useGlobalStreak,
  useUnlockedAchievementsCount,
  useTasksQuery,
  useTaskStats,
  useHabitsQuery,
  useHabitStats,
  getXpForNextLevel,
} from '@/hooks'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  subtitle?: string
  color?: string
}

function StatCard({ icon, label, value, subtitle, color }: StatCardProps) {
  const { colors } = useTheme()

  return (
    <View style={[styles.statCard, { backgroundColor: colors.card }, cardShadow]}>
      <View style={[styles.statCardIcon, { backgroundColor: (color || colors.accent) + '15' }]}>
        {icon}
      </View>
      <Text style={[styles.statCardValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statCardLabel, { color: colors.mutedForeground }]}>{label}</Text>
      {subtitle && (
        <Text style={[styles.statCardSubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>
      )}
    </View>
  )
}

interface StatsSectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  delay: number
}

function StatsSection({ title, icon, children, delay }: StatsSectionProps) {
  const { colors } = useTheme()

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  )
}

export default function StatisticsScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()

  const { data: userStats, isLoading, refetch } = useUserStats()
  const level = useLevel()
  const xpProgressData = useXpProgress()
  const globalStreak = useGlobalStreak()
  const achievementsCount = useUnlockedAchievementsCount()

  // Fetch tasks and habits to compute stats
  const { data: tasks } = useTasksQuery()
  const { data: habits } = useHabitsQuery()
  const taskStats = useTaskStats(tasks)
  const habitStats = useHabitStats(habits)

  const xpToNextLevel = xpProgressData.xpToNext
  const xpProgress = xpProgressData.progress

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen
        options={{
          title: t('gamification.stats.title'),
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
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.accent}
          />
        }
      >
        {/* Level & XP Overview */}
        <View
         
          style={[styles.levelCard, { backgroundColor: colors.accent }]}
        >
          <View style={styles.levelHeader}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelNumber}>{level}</Text>
            </View>
            <View style={styles.levelInfo}>
              <Text style={styles.levelTitle}>{t('gamification.level')} {level}</Text>
              <Text style={styles.levelXp}>
                {t('gamification.xpToNext', { amount: Math.max(0, xpToNextLevel) })}
              </Text>
            </View>
            <View style={styles.totalXpBadge}>
              <Zap size={16} color="#fff" />
              <Text style={styles.totalXpText}>{userStats?.totalXp || 0}</Text>
            </View>
          </View>

          {/* XP Progress Bar */}
          <View style={styles.xpProgressContainer}>
            <View style={styles.xpProgressBg}>
              <View style={[styles.xpProgressFill, { width: `${xpProgress * 100}%` }]} />
            </View>
            <Text style={styles.xpProgressText}>
              {Math.round(xpProgress * 100)}%
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={[styles.quickStatItem, { backgroundColor: colors.card }, cardShadow]}>
            <Flame size={24} color="#ef4444" />
            <Text style={[styles.quickStatValue, { color: colors.foreground }]}>
              {globalStreak.currentStreak}
            </Text>
            <Text style={[styles.quickStatLabel, { color: colors.mutedForeground }]}>
              {t('habits.streak')}
            </Text>
          </View>
          <View style={[styles.quickStatItem, { backgroundColor: colors.card }, cardShadow]}>
            <Trophy size={24} color="#eab308" />
            <Text style={[styles.quickStatValue, { color: colors.foreground }]}>
              {achievementsCount}
            </Text>
            <Text style={[styles.quickStatLabel, { color: colors.mutedForeground }]}>
              {t('gamification.achievements.title')}
            </Text>
          </View>
        </View>

        {/* Habits Stats */}
        <StatsSection
          title={t('gamification.stats.habits.title')}
          icon={<Target size={20} color={colors.accent} />}
          delay={150}
        >
          <View style={styles.statsGrid}>
            <StatCard
              icon={<CheckCircle2 size={20} color="#22c55e" />}
              label={t('gamification.stats.habits.completed')}
              value={habitStats.completedToday}
              subtitle={t('habits.today')}
              color="#22c55e"
            />
            <StatCard
              icon={<TrendingUp size={20} color="#3b82f6" />}
              label={t('gamification.stats.habits.total')}
              value={habitStats.active}
              subtitle={t('habits.active')}
              color="#3b82f6"
            />
            <StatCard
              icon={<Flame size={20} color="#ef4444" />}
              label={t('gamification.stats.habits.currentStreak')}
              value={globalStreak.currentStreak}
              subtitle={t('habits.days')}
              color="#ef4444"
            />
            <StatCard
              icon={<Trophy size={20} color="#eab308" />}
              label={t('gamification.stats.habits.longestStreak')}
              value={globalStreak.longestStreak}
              subtitle={t('habits.days')}
              color="#eab308"
            />
          </View>
        </StatsSection>

        {/* Tasks Stats */}
        <StatsSection
          title={t('gamification.stats.tasks.title')}
          icon={<CheckCircle2 size={20} color={colors.accent} />}
          delay={200}
        >
          <View style={styles.statsGrid}>
            <StatCard
              icon={<BarChart3 size={20} color={colors.accent} />}
              label={t('gamification.stats.tasks.total')}
              value={taskStats.total}
              color={colors.accent}
            />
            <StatCard
              icon={<CheckCircle2 size={20} color="#22c55e" />}
              label={t('gamification.stats.tasks.completed')}
              value={taskStats.done}
              color="#22c55e"
            />
            <StatCard
              icon={<Clock size={20} color="#f97316" />}
              label={t('gamification.stats.tasks.pending')}
              value={taskStats.pending}
              color="#f97316"
            />
            <StatCard
              icon={<Calendar size={20} color="#8b5cf6" />}
              label={t('tasks.in_progress')}
              value={taskStats.inProgress}
              color="#8b5cf6"
            />
          </View>
        </StatsSection>

        {/* XP Breakdown */}
        <StatsSection
          title={t('gamification.xpBreakdown.title')}
          icon={<Zap size={20} color={colors.accent} />}
          delay={250}
        >
          <View style={[styles.xpBreakdownCard, { backgroundColor: colors.card }, cardShadow]}>
            <View style={styles.xpBreakdownItem}>
              <View style={[styles.xpBreakdownIcon, { backgroundColor: '#22c55e15' }]}>
                <Target size={18} color="#22c55e" />
              </View>
              <View style={styles.xpBreakdownContent}>
                <Text style={[styles.xpBreakdownLabel, { color: colors.foreground }]}>
                  {t('gamification.xpBreakdown.habit')}
                </Text>
                <Text style={[styles.xpBreakdownValue, { color: colors.mutedForeground }]}>
                  {t('gamification.xpBreakdown.perCompletion', { amount: 10 })}
                </Text>
              </View>
              <Zap size={16} color="#22c55e" />
            </View>

            <View style={[styles.xpBreakdownDivider, { backgroundColor: colors.border }]} />

            <View style={styles.xpBreakdownItem}>
              <View style={[styles.xpBreakdownIcon, { backgroundColor: '#3b82f615' }]}>
                <CheckCircle2 size={18} color="#3b82f6" />
              </View>
              <View style={styles.xpBreakdownContent}>
                <Text style={[styles.xpBreakdownLabel, { color: colors.foreground }]}>
                  {t('gamification.xpBreakdown.task')}
                </Text>
                <Text style={[styles.xpBreakdownValue, { color: colors.mutedForeground }]}>
                  {t('gamification.xpBreakdown.perCompletion', { amount: 15 })}
                </Text>
              </View>
              <Zap size={16} color="#3b82f6" />
            </View>

            <View style={[styles.xpBreakdownDivider, { backgroundColor: colors.border }]} />

            <View style={styles.xpBreakdownItem}>
              <View style={[styles.xpBreakdownIcon, { backgroundColor: '#eab30815' }]}>
                <Trophy size={18} color="#eab308" />
              </View>
              <View style={styles.xpBreakdownContent}>
                <Text style={[styles.xpBreakdownLabel, { color: colors.foreground }]}>
                  {t('gamification.xpBreakdown.achievement')}
                </Text>
                <Text style={[styles.xpBreakdownValue, { color: colors.mutedForeground }]}>
                  {t('gamification.xpBreakdown.perCompletion', { amount: 50 })}
                </Text>
              </View>
              <Zap size={16} color="#eab308" />
            </View>
          </View>
        </StatsSection>
      </ScrollView>
    </SafeAreaView>
  )
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

  // Level Card
  levelCard: {
    marginTop: spacing[4],
    padding: spacing[5],
    borderRadius: radius['2xl'],
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  levelBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  levelInfo: {
    flex: 1,
    marginLeft: spacing[4],
  },
  levelTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: '#fff',
  },
  levelXp: {
    fontSize: typography.size.sm,
    color: 'rgba(255,255,255,0.8)',
    marginTop: spacing[0.5],
  },
  totalXpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: radius.full,
  },
  totalXpText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: '#fff',
  },
  xpProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  xpProgressBg: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  xpProgressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: radius.full,
  },
  xpProgressText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: '#fff',
    width: 40,
    textAlign: 'right',
  },

  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[4],
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: radius.xl,
    gap: spacing[2],
  },
  quickStatValue: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
  },
  quickStatLabel: {
    fontSize: typography.size.xs,
    textAlign: 'center',
  },

  // Section
  section: {
    marginTop: spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
  sectionContent: {},

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  statCard: {
    width: '47%',
    padding: spacing[4],
    borderRadius: radius.xl,
    gap: spacing[2],
  },
  statCardIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCardValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
  },
  statCardLabel: {
    fontSize: typography.size.xs,
  },
  statCardSubtitle: {
    fontSize: typography.size.xs,
    marginTop: -spacing[1],
  },

  // XP Breakdown
  xpBreakdownCard: {
    padding: spacing[4],
    borderRadius: radius.xl,
  },
  xpBreakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  xpBreakdownIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpBreakdownContent: {
    flex: 1,
  },
  xpBreakdownLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  xpBreakdownValue: {
    fontSize: typography.size.xs,
    marginTop: spacing[0.5],
  },
  xpBreakdownDivider: {
    height: 1,
    marginVertical: spacing[3],
  },
})
