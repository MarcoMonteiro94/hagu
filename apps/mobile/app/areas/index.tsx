import { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { Stack, useRouter } from 'expo-router'
import {
  Plus,
  ChevronRight,
  CheckCircle2,
  Target,
  Folder,
} from 'lucide-react-native'
import { useTheme, cardShadow, spacing, radius, typography } from '@/theme'
import { useAreasQuery, useHabitsQuery, useTasksQuery } from '@/hooks'
import { ProgressRing } from '@/components/charts'

// =============================================================================
// Types
// =============================================================================

interface AreaStats {
  habitsCount: number
  habitsCompleted: number
  tasksCount: number
  tasksCompleted: number
}

// =============================================================================
// Area Card Component
// =============================================================================

interface AreaCardProps {
  area: {
    id: string
    name: string
    slug: string
    color: string
    icon: string
  }
  stats: AreaStats
  onPress: () => void
  delay: number
}

function AreaCard({ area, stats, onPress, delay }: AreaCardProps) {
  const { colors } = useTheme()
  const { t } = useTranslation()

  const totalItems = stats.habitsCount + stats.tasksCount
  const completedItems = stats.habitsCompleted + stats.tasksCompleted
  const completionRate = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

  return (
    <View>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.areaCard,
          { backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 },
          cardShadow,
        ]}
      >
        <View style={styles.areaCardContent}>
          {/* Left: Color indicator and info */}
          <View style={styles.areaCardLeft}>
            <View style={[styles.colorIndicator, { backgroundColor: area.color }]} />
            <View style={styles.areaInfo}>
              <Text style={[styles.areaName, { color: colors.foreground }]}>
                {area.name}
              </Text>
              <View style={styles.areaStatsRow}>
                <View style={styles.statItem}>
                  <Target size={14} color={colors.mutedForeground} />
                  <Text style={[styles.statText, { color: colors.mutedForeground }]}>
                    {stats.habitsCount} {t('habits.title').toLowerCase()}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <CheckCircle2 size={14} color={colors.mutedForeground} />
                  <Text style={[styles.statText, { color: colors.mutedForeground }]}>
                    {stats.tasksCount} {t('tasks.title').toLowerCase()}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Right: Progress ring and chevron */}
          <View style={styles.areaCardRight}>
            {totalItems > 0 && (
              <ProgressRing
                progress={completionRate}
                size={44}
                strokeWidth={4}
                color={area.color}
                showPercentage={false}
              />
            )}
            <ChevronRight size={20} color={colors.mutedForeground} />
          </View>
        </View>
      </Pressable>
    </View>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export default function AreasScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const router = useRouter()

  const { data: areas = [], isLoading: areasLoading, refetch: refetchAreas } = useAreasQuery()
  const { data: habits = [], isLoading: habitsLoading, refetch: refetchHabits } = useHabitsQuery()
  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useTasksQuery()

  const isLoading = areasLoading || habitsLoading || tasksLoading

  const handleRefresh = () => {
    refetchAreas()
    refetchHabits()
    refetchTasks()
  }

  // Calculate stats for each area
  const areaStats = useMemo(() => {
    const stats: Record<string, AreaStats> = {}
    const today = new Date().toISOString().split('T')[0]

    areas.forEach((area) => {
      const areaHabits = habits.filter((h) => h.areaId === area.id && !h.archivedAt)
      const areaTasks = tasks.filter((t) => t.areaId === area.id)

      // Count habits completed today
      const habitsCompletedToday = areaHabits.filter((h) =>
        h.completions.some((c) => c.date === today)
      ).length

      // Count completed tasks
      const completedTasks = areaTasks.filter((t) => t.status === 'done').length

      stats[area.id] = {
        habitsCount: areaHabits.length,
        habitsCompleted: habitsCompletedToday,
        tasksCount: areaTasks.length,
        tasksCompleted: completedTasks,
      }
    })

    return stats
  }, [areas, habits, tasks])

  // Overall stats
  const overallStats = useMemo(() => {
    const activeHabits = habits.filter((h) => !h.archivedAt)
    const today = new Date().toISOString().split('T')[0]
    const habitsCompletedToday = activeHabits.filter((h) =>
      h.completions.some((c) => c.date === today)
    ).length

    const pendingTasks = tasks.filter((t) => t.status !== 'done').length
    const completedTasks = tasks.filter((t) => t.status === 'done').length

    return {
      totalAreas: areas.length,
      totalHabits: activeHabits.length,
      habitsCompletedToday,
      totalTasks: tasks.length,
      pendingTasks,
      completedTasks,
    }
  }, [areas, habits, tasks])

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen
        options={{
          title: t('areas.title'),
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerShadowVisible: false,
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/areas/new')}
              hitSlop={8}
              style={styles.headerButton}
            >
              <Plus size={24} color={colors.accent} />
            </Pressable>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Overview Stats */}
        <View
         
          style={[styles.overviewCard, { backgroundColor: colors.card }, cardShadow]}
        >
          <View style={styles.overviewHeader}>
            <Folder size={20} color={colors.accent} />
            <Text style={[styles.overviewTitle, { color: colors.foreground }]}>
              {t('areas.overview')}
            </Text>
          </View>
          <View style={styles.overviewStats}>
            <View style={styles.overviewStat}>
              <Text style={[styles.overviewStatValue, { color: colors.foreground }]}>
                {overallStats.totalAreas}
              </Text>
              <Text style={[styles.overviewStatLabel, { color: colors.mutedForeground }]}>
                {t('areas.title')}
              </Text>
            </View>
            <View style={[styles.overviewDivider, { backgroundColor: colors.border }]} />
            <View style={styles.overviewStat}>
              <Text style={[styles.overviewStatValue, { color: colors.foreground }]}>
                {overallStats.habitsCompletedToday}/{overallStats.totalHabits}
              </Text>
              <Text style={[styles.overviewStatLabel, { color: colors.mutedForeground }]}>
                {t('habits.completedToday')}
              </Text>
            </View>
            <View style={[styles.overviewDivider, { backgroundColor: colors.border }]} />
            <View style={styles.overviewStat}>
              <Text style={[styles.overviewStatValue, { color: colors.foreground }]}>
                {overallStats.pendingTasks}
              </Text>
              <Text style={[styles.overviewStatLabel, { color: colors.mutedForeground }]}>
                {t('tasks.pending')}
              </Text>
            </View>
          </View>
        </View>

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t('areas.lifeAreas')}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
            {t('areas.lifeAreasDescription')}
          </Text>
        </View>

        {/* Areas List */}
        {areas.length === 0 ? (
          <View
           
            style={[styles.emptyCard, { backgroundColor: colors.card }, cardShadow]}
          >
            <Folder size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {t('areas.noAreas')}
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
              {t('areas.noAreasDescription')}
            </Text>
            <Pressable
              onPress={() => router.push('/areas/new')}
              style={[styles.emptyButton, { backgroundColor: colors.accent }]}
            >
              <Plus size={18} color="#fff" />
              <Text style={styles.emptyButtonText}>{t('areas.createArea')}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.areasList}>
            {areas.map((area, index) => (
              <AreaCard
                key={area.id}
                area={area}
                stats={areaStats[area.id] || { habitsCount: 0, habitsCompleted: 0, tasksCount: 0, tasksCompleted: 0 }}
                onPress={() => router.push(`/areas/${area.id}`)}
                delay={150 + index * 50}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

// =============================================================================
// Styles
// =============================================================================

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
  headerButton: {
    padding: spacing[2],
  },

  // Overview Card
  overviewCard: {
    marginTop: spacing[4],
    padding: spacing[5],
    borderRadius: radius.xl,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  overviewTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  overviewStat: {
    alignItems: 'center',
    flex: 1,
  },
  overviewStatValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
  },
  overviewStatLabel: {
    fontSize: typography.size.xs,
    marginTop: spacing[0.5],
    textAlign: 'center',
  },
  overviewDivider: {
    width: 1,
    height: 32,
  },

  // Section Header
  sectionHeader: {
    marginTop: spacing[6],
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
  sectionSubtitle: {
    fontSize: typography.size.sm,
    marginTop: spacing[0.5],
  },

  // Area Card
  areasList: {
    gap: spacing[3],
  },
  areaCard: {
    borderRadius: radius.xl,
    padding: spacing[4],
  },
  areaCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  areaCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorIndicator: {
    width: 4,
    height: 48,
    borderRadius: 2,
    marginRight: spacing[3],
  },
  areaInfo: {
    flex: 1,
  },
  areaName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  areaStatsRow: {
    flexDirection: 'row',
    gap: spacing[4],
    marginTop: spacing[1],
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  statText: {
    fontSize: typography.size.xs,
  },
  areaCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },

  // Empty State
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
    borderRadius: radius.xl,
    gap: spacing[3],
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: typography.size.sm,
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    marginTop: spacing[2],
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
})
