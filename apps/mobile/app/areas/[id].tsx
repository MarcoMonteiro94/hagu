import { useMemo } from 'react'
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
import { Stack, useRouter, useLocalSearchParams } from 'expo-router'
import {
  MoreVertical,
  Target,
  CheckCircle2,
  Clock,
  TrendingUp,
  Plus,
} from 'lucide-react-native'
import { useTheme, cardShadow, spacing, radius, typography } from '@/theme'
import { useAreaQuery, useHabitsQuery, useTasksQuery } from '@/hooks'
import { ProgressRing, DonutChart } from '@/components/charts'

// =============================================================================
// Stat Card Component
// =============================================================================

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  color?: string
  delay: number
}

function StatCard({ icon, label, value, color, delay }: StatCardProps) {
  const { colors } = useTheme()

  return (
    <View
     
      style={[styles.statCard, { backgroundColor: colors.card }, cardShadow]}
    >
      <View style={[styles.statIcon, { backgroundColor: (color || colors.accent) + '15' }]}>
        {icon}
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  )
}

// =============================================================================
// Item Card Component
// =============================================================================

interface ItemCardProps {
  type: 'habit' | 'task'
  title: string
  subtitle?: string
  isCompleted?: boolean
  color?: string
  onPress: () => void
}

function ItemCard({ type, title, subtitle, isCompleted, color, onPress }: ItemCardProps) {
  const { colors } = useTheme()

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.itemCard,
        { backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 },
        cardShadow,
      ]}
    >
      <View style={[styles.itemIndicator, { backgroundColor: color || colors.accent }]} />
      <View style={styles.itemContent}>
        <Text
          style={[
            styles.itemTitle,
            { color: colors.foreground },
            isCompleted && styles.itemTitleCompleted,
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.itemSubtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {isCompleted && <CheckCircle2 size={20} color={colors.success} />}
    </Pressable>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export default function AreaDetailScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()

  const { data: area, isLoading: areaLoading, refetch: refetchArea } = useAreaQuery(id)
  const { data: habits = [], isLoading: habitsLoading, refetch: refetchHabits } = useHabitsQuery()
  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useTasksQuery()

  const isLoading = areaLoading || habitsLoading || tasksLoading

  const handleRefresh = () => {
    refetchArea()
    refetchHabits()
    refetchTasks()
  }

  // Filter items for this area
  const areaHabits = useMemo(() => {
    return habits.filter((h) => h.areaId === id && !h.archivedAt)
  }, [habits, id])

  const areaTasks = useMemo(() => {
    return tasks.filter((t) => t.areaId === id)
  }, [tasks, id])

  // Calculate statistics
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]

    // Habits stats
    const habitsCompletedToday = areaHabits.filter((h) =>
      h.completions.some((c) => c.date === today)
    ).length

    // Calculate average completion rate (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    let totalExpected = 0
    let totalCompleted = 0

    areaHabits.forEach((habit) => {
      for (let i = 0; i < 7; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        totalExpected++
        if (habit.completions.some((c) => c.date === dateStr)) {
          totalCompleted++
        }
      }
    })

    const weeklyCompletionRate = totalExpected > 0
      ? Math.round((totalCompleted / totalExpected) * 100)
      : 0

    // Tasks stats
    const completedTasks = areaTasks.filter((t) => t.status === 'done').length
    const pendingTasks = areaTasks.filter((t) => t.status !== 'done').length
    const overdueTasks = areaTasks.filter((t) => {
      if (t.status === 'done' || !t.dueDate) return false
      return new Date(t.dueDate) < new Date()
    }).length

    // Tasks by status for chart
    const tasksByStatus = [
      { label: t('tasks.done'), value: completedTasks, color: colors.success },
      { label: t('tasks.pending'), value: areaTasks.filter((t) => t.status === 'pending').length, color: colors.mutedForeground },
      { label: t('tasks.inProgress'), value: areaTasks.filter((t) => t.status === 'in_progress').length, color: colors.info },
    ].filter((item) => item.value > 0)

    return {
      habitsCount: areaHabits.length,
      habitsCompletedToday,
      weeklyCompletionRate,
      tasksCount: areaTasks.length,
      completedTasks,
      pendingTasks,
      overdueTasks,
      tasksByStatus,
    }
  }, [areaHabits, areaTasks, t, colors])

  if (!area && !isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <Stack.Screen options={{ title: t('areas.areaNotFound') }} />
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {t('areas.areaNotFound')}
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen
        options={{
          title: area?.name || '',
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerShadowVisible: false,
          headerRight: () => (
            <Pressable hitSlop={8} style={styles.headerButton}>
              <MoreVertical size={22} color={colors.foreground} />
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
        {/* Area Header */}
        <View
         
          style={[styles.headerCard, { backgroundColor: area?.color || colors.accent }]}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>{area?.name}</Text>
              <Text style={styles.headerSubtitle}>
                {stats.habitsCount} {t('habits.title').toLowerCase()} • {stats.tasksCount} {t('tasks.title').toLowerCase()}
              </Text>
            </View>
            <ProgressRing
              progress={stats.weeklyCompletionRate}
              size={64}
              strokeWidth={5}
              color="#fff"
              backgroundColor="rgba(255,255,255,0.3)"
              showPercentage
            />
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <StatCard
            icon={<Target size={18} color={colors.accent} />}
            label={t('habits.completedToday')}
            value={`${stats.habitsCompletedToday}/${stats.habitsCount}`}
            color={colors.accent}
            delay={100}
          />
          <StatCard
            icon={<TrendingUp size={18} color={colors.success} />}
            label={t('areas.weeklyRate')}
            value={`${stats.weeklyCompletionRate}%`}
            color={colors.success}
            delay={150}
          />
          <StatCard
            icon={<CheckCircle2 size={18} color={colors.info} />}
            label={t('tasks.done')}
            value={stats.completedTasks}
            color={colors.info}
            delay={200}
          />
          <StatCard
            icon={<Clock size={18} color={stats.overdueTasks > 0 ? colors.error : colors.mutedForeground} />}
            label={t('areas.overdue')}
            value={stats.overdueTasks}
            color={stats.overdueTasks > 0 ? colors.error : colors.mutedForeground}
            delay={250}
          />
        </View>

        {/* Task Status Chart */}
        {stats.tasksByStatus.length > 0 && (
          <View
           
            style={[styles.chartCard, { backgroundColor: colors.card }, cardShadow]}
          >
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {t('areas.taskStatus')}
            </Text>
            <View style={styles.chartContainer}>
              <DonutChart
                data={stats.tasksByStatus}
                size={140}
                thickness={20}
                showLegend
                showCenter
                centerValue={String(stats.tasksCount)}
                centerLabel={t('tasks.title')}
              />
            </View>
          </View>
        )}

        {/* Habits Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {t('habits.title')}
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/habits')}
              style={[styles.addButton, { backgroundColor: colors.accent + '15' }]}
            >
              <Plus size={16} color={colors.accent} />
              <Text style={[styles.addButtonText, { color: colors.accent }]}>
                {t('habits.addHabit')}
              </Text>
            </Pressable>
          </View>
          {areaHabits.length === 0 ? (
            <View style={[styles.emptySection, { backgroundColor: colors.muted }]}>
              <Text style={[styles.emptySectionText, { color: colors.mutedForeground }]}>
                {t('areas.noHabitsInArea')}
              </Text>
            </View>
          ) : (
            <View style={styles.itemsList}>
              {areaHabits.slice(0, 5).map((habit) => {
                const today = new Date().toISOString().split('T')[0]
                const isCompletedToday = habit.completions.some((c) => c.date === today)
                return (
                  <ItemCard
                    key={habit.id}
                    type="habit"
                    title={habit.title}
                    subtitle={`${habit.completions.length} ${t('habits.totalCompletions').toLowerCase()}`}
                    isCompleted={isCompletedToday}
                    color={habit.color || area?.color}
                    onPress={() => router.push(`/habit/${habit.id}`)}
                  />
                )
              })}
              {areaHabits.length > 5 && (
                <Pressable
                  onPress={() => router.push('/habits')}
                  style={styles.viewAllButton}
                >
                  <Text style={[styles.viewAllText, { color: colors.accent }]}>
                    {t('common.viewAll')} ({areaHabits.length})
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>

        {/* Tasks Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {t('tasks.title')}
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/tasks')}
              style={[styles.addButton, { backgroundColor: colors.accent + '15' }]}
            >
              <Plus size={16} color={colors.accent} />
              <Text style={[styles.addButtonText, { color: colors.accent }]}>
                {t('tasks.addTask')}
              </Text>
            </Pressable>
          </View>
          {areaTasks.length === 0 ? (
            <View style={[styles.emptySection, { backgroundColor: colors.muted }]}>
              <Text style={[styles.emptySectionText, { color: colors.mutedForeground }]}>
                {t('areas.noTasksInArea')}
              </Text>
            </View>
          ) : (
            <View style={styles.itemsList}>
              {areaTasks
                .filter((t) => t.status !== 'done')
                .slice(0, 5)
                .map((task) => (
                  <ItemCard
                    key={task.id}
                    type="task"
                    title={task.title}
                    subtitle={task.dueDate ? new Date(task.dueDate).toLocaleDateString() : undefined}
                    isCompleted={task.status === 'done'}
                    color={area?.color}
                    onPress={() => router.push(`/task/${task.id}`)}
                  />
                ))}
              {areaTasks.length > 5 && (
                <Pressable
                  onPress={() => router.push('/tasks')}
                  style={styles.viewAllButton}
                >
                  <Text style={[styles.viewAllText, { color: colors.accent }]}>
                    {t('common.viewAll')} ({areaTasks.length})
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
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
    paddingBottom: spacing[8],
  },
  headerButton: {
    padding: spacing[2],
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: typography.size.sm,
  },

  // Header Card
  headerCard: {
    marginHorizontal: spacing[4],
    marginTop: spacing[4],
    padding: spacing[5],
    borderRadius: radius.xl,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
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

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    padding: spacing[4],
  },
  statCard: {
    width: '47%',
    padding: spacing[3],
    borderRadius: radius.xl,
    alignItems: 'center',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  statValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
  },
  statLabel: {
    fontSize: typography.size.xs,
    marginTop: spacing[0.5],
    textAlign: 'center',
  },

  // Chart Card
  chartCard: {
    marginHorizontal: spacing[4],
    padding: spacing[4],
    borderRadius: radius.xl,
    marginBottom: spacing[4],
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: spacing[3],
  },

  // Sections
  section: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: radius.md,
  },
  addButtonText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },

  // Items List
  itemsList: {
    gap: spacing[2],
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: radius.lg,
  },
  itemIndicator: {
    width: 3,
    height: 32,
    borderRadius: 1.5,
    marginRight: spacing[3],
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  itemTitleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  itemSubtitle: {
    fontSize: typography.size.xs,
    marginTop: spacing[0.5],
  },
  viewAllButton: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  viewAllText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },

  // Empty Section
  emptySection: {
    padding: spacing[4],
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  emptySectionText: {
    fontSize: typography.size.sm,
  },
})
