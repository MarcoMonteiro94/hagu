import { useState, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'expo-router'
import {
  ChevronRight,
  CheckCircle2,
  Target,
  Folder,
  Heart,
  Wallet,
  Rocket,
  BookOpen,
  Palette,
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
// Icon Mapping
// =============================================================================

function getAreaIcon(slug: string, color: string, size = 20) {
  switch (slug) {
    case 'health':
      return <Heart size={size} color={color} />
    case 'finances':
      return <Wallet size={size} color={color} />
    case 'projects':
      return <Rocket size={size} color={color} />
    case 'studies':
      return <BookOpen size={size} color={color} />
    case 'hobbies':
      return <Palette size={size} color={color} />
    default:
      return <Folder size={size} color={color} />
  }
}

// =============================================================================
// Route Mapping - where each area navigates to
// =============================================================================

function getAreaRoute(slug: string): string {
  switch (slug) {
    case 'health':
      return '/health'
    case 'finances':
      return '/finances'
    case 'projects':
      return '/projects'
    case 'studies':
      return '/notes' // Studies connects to Notes/Notebooks
    default:
      return `/areas/${slug}`
  }
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
  const insets = useSafeAreaInsets()
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
          {/* Left: Icon and info */}
          <View style={styles.areaCardLeft}>
            <View style={[styles.iconContainer, { backgroundColor: area.color + '20' }]}>
              {getAreaIcon(area.slug, area.color, 24)}
            </View>
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

export default function AreasTab() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const { data: areas = [], isLoading: areasLoading, refetch: refetchAreas } = useAreasQuery()
  const { data: habits = [], isLoading: habitsLoading, refetch: refetchHabits } = useHabitsQuery()
  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useTasksQuery()

  const isLoading = areasLoading || habitsLoading || tasksLoading
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await Promise.all([refetchAreas(), refetchHabits(), refetchTasks()])
    setIsRefreshing(false)
  }, [refetchAreas, refetchHabits, refetchTasks])

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

    return {
      totalAreas: areas.length,
      totalHabits: activeHabits.length,
      habitsCompletedToday,
      pendingTasks,
    }
  }, [areas, habits, tasks])

  const handleAreaPress = useCallback((area: { slug: string }) => {
    const route = getAreaRoute(area.slug)
    router.push(route as any)
  }, [router])

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, spacing[8]) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {t('areas.title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {t('areas.lifeAreasDescription')}
          </Text>
        </View>

        {/* Overview Stats */}
        <View
         
          style={[styles.overviewCard, { backgroundColor: colors.card }, cardShadow]}
        >
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

        {/* Areas List */}
        <View style={styles.areasList}>
          {areas.map((area, index) => (
            <AreaCard
              key={area.id}
              area={area}
              stats={areaStats[area.id] || { habitsCount: 0, habitsCompleted: 0, tasksCount: 0, tasksCompleted: 0 }}
              onPress={() => handleAreaPress(area)}
              delay={150 + index * 50}
            />
          ))}
        </View>

        {/* Empty State */}
        {areas.length === 0 && !isLoading && (
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
  },

  // Header
  header: {
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
  },
  subtitle: {
    fontSize: typography.size.sm,
    marginTop: spacing[1],
  },

  // Overview Card
  overviewCard: {
    padding: spacing[4],
    borderRadius: radius.xl,
    marginBottom: spacing[4],
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
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
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
})
