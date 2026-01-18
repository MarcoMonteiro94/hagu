import { useState, useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { Stack } from 'expo-router'
import {
  BarChart3,
  TrendingUp,
  Target,
  Flame,
  CheckCircle2,
  Calendar,
  Lightbulb,
  ListTodo,
  Clock,
  FolderKanban,
} from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useTheme, cardShadow, spacing, radius, typography, chartColors } from '@/theme'
import { useHabitsQuery, useTasksQuery, useAreasQuery } from '@/hooks'
import { BarChart, LineChart, DonutChart, PieChart, ProgressRing } from '@/components/charts'

// =============================================================================
// Types
// =============================================================================

type TimeRange = 'week' | 'month'

// =============================================================================
// Helpers
// =============================================================================

function getStartOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function getStartOfMonth(date: Date): Date {
  const d = new Date(date)
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d
}

function getDayLabels(locale: string): string[] {
  return locale === 'pt-BR'
    ? ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
}

function calculateStreak(
  completions: Array<{ date: string }>
): number {
  if (!completions || completions.length === 0) return 0

  const dates = completions.map((c) => c.date).sort((a, b) => b.localeCompare(a))
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  const checkDate = dates[0] === today ? today : dates[0] === yesterday ? yesterday : null
  if (!checkDate) return 0

  let streak = 1
  let prevDate = new Date(checkDate)

  for (let i = 1; i < dates.length; i++) {
    const expectedPrev = new Date(prevDate)
    expectedPrev.setDate(expectedPrev.getDate() - 1)
    const expectedPrevStr = expectedPrev.toISOString().split('T')[0]

    if (dates[i] === expectedPrevStr) {
      streak++
      prevDate = expectedPrev
    } else {
      break
    }
  }

  return streak
}

// =============================================================================
// Components
// =============================================================================

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  subValue?: string
  color?: string
  delay?: number
}

function StatCard({ icon, label, value, subValue, color, delay = 0 }: StatCardProps) {
  const { colors } = useTheme()

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).duration(400)}
      style={[styles.statCard, { backgroundColor: colors.card }, cardShadow]}
    >
      <View style={[styles.statIcon, { backgroundColor: (color || colors.accent) + '20' }]}>
        {icon}
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      {subValue && (
        <Text style={[styles.statSubValue, { color: color || colors.accent }]}>{subValue}</Text>
      )}
    </Animated.View>
  )
}

interface TimeRangeSelectorProps {
  selected: TimeRange
  onSelect: (range: TimeRange) => void
}

function TimeRangeSelector({ selected, onSelect }: TimeRangeSelectorProps) {
  const { t } = useTranslation()
  const { colors } = useTheme()

  const options: { key: TimeRange; label: string }[] = [
    { key: 'week', label: t('analytics.weekly') },
    { key: 'month', label: t('analytics.monthly') },
  ]

  return (
    <View style={[styles.rangeSelector, { backgroundColor: colors.muted }]}>
      {options.map((option) => (
        <Pressable
          key={option.key}
          onPress={() => onSelect(option.key)}
          style={[
            styles.rangeOption,
            selected === option.key && { backgroundColor: colors.accent },
          ]}
        >
          <Text
            style={[
              styles.rangeOptionText,
              { color: selected === option.key ? '#fff' : colors.foreground },
            ]}
          >
            {option.label}
          </Text>
        </Pressable>
      ))}
    </View>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export default function AnalyticsScreen() {
  const { t, i18n } = useTranslation()
  const { colors } = useTheme()
  const locale = i18n.language

  const [timeRange, setTimeRange] = useState<TimeRange>('week')

  const { data: habits = [], isLoading: habitsLoading, refetch: refetchHabits } = useHabitsQuery()
  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useTasksQuery()
  const { data: areas = [], isLoading: areasLoading, refetch: refetchAreas } = useAreasQuery()

  const isLoading = habitsLoading || tasksLoading || areasLoading

  const handleRefresh = () => {
    refetchHabits()
    refetchTasks()
    refetchAreas()
  }

  // Calculate analytics data
  const analytics = useMemo(() => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    // Date ranges
    const startOfCurrentWeek = getStartOfWeek(now)
    const startOfLastWeek = new Date(startOfCurrentWeek)
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7)

    const startOfCurrentMonth = getStartOfMonth(now)
    const startOfLastMonth = new Date(startOfCurrentMonth)
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1)

    // Active habits (non-archived)
    const activeHabits = habits.filter((h) => !h.archivedAt)

    // Habit completions in time range
    const isInCurrentWeek = (date: string) => new Date(date) >= startOfCurrentWeek
    const isInLastWeek = (date: string) => {
      const d = new Date(date)
      return d >= startOfLastWeek && d < startOfCurrentWeek
    }
    const isInCurrentMonth = (date: string) => new Date(date) >= startOfCurrentMonth
    const isInLastMonth = (date: string) => {
      const d = new Date(date)
      return d >= startOfLastMonth && d < startOfCurrentMonth
    }

    // Count completions
    let currentPeriodCompletions = 0
    let lastPeriodCompletions = 0
    const dailyCompletions: Record<string, number> = {}
    const dayLabels = getDayLabels(locale)

    // Initialize daily completions
    for (let i = 0; i < 7; i++) {
      dailyCompletions[dayLabels[i]] = 0
    }

    activeHabits.forEach((habit) => {
      habit.completions.forEach((c) => {
        if (timeRange === 'week') {
          if (isInCurrentWeek(c.date)) {
            currentPeriodCompletions++
            const dayOfWeek = new Date(c.date).getDay()
            dailyCompletions[dayLabels[dayOfWeek]]++
          }
          if (isInLastWeek(c.date)) {
            lastPeriodCompletions++
          }
        } else {
          if (isInCurrentMonth(c.date)) {
            currentPeriodCompletions++
          }
          if (isInLastMonth(c.date)) {
            lastPeriodCompletions++
          }
        }
      })
    })

    // Completion rate calculation
    const daysInRange = timeRange === 'week' ? 7 : now.getDate()
    const expectedCompletions = activeHabits.length * daysInRange
    const completionRate = expectedCompletions > 0
      ? Math.round((currentPeriodCompletions / expectedCompletions) * 100)
      : 0

    // Daily completion data for chart
    const dailyData = dayLabels.map((label) => ({
      label,
      value: dailyCompletions[label],
    }))

    // Best day
    const bestDayIndex = dailyData.reduce(
      (max, curr, i) => (curr.value > dailyData[max].value ? i : max),
      0
    )
    const bestDay = dailyData[bestDayIndex].label

    // Max streak from all habits
    const maxStreak = activeHabits.reduce((max, habit) => {
      const streak = calculateStreak(habit.completions)
      return Math.max(max, streak)
    }, 0)

    // Task analytics
    const completedTasks = tasks.filter((t) => t.status === 'done')
    const pendingTasks = tasks.filter((t) => t.status !== 'done')

    const currentWeekTasks = completedTasks.filter(
      (t) => t.completedAt && isInCurrentWeek(t.completedAt)
    ).length
    const lastWeekTasks = completedTasks.filter(
      (t) => t.completedAt && isInLastWeek(t.completedAt)
    ).length

    // Task improvement percentage
    const taskImprovement = lastWeekTasks > 0
      ? Math.round(((currentWeekTasks - lastWeekTasks) / lastWeekTasks) * 100)
      : currentWeekTasks > 0 ? 100 : 0

    // Tasks by priority
    const tasksByPriority = [
      { label: t('tasks.urgent'), value: tasks.filter((t) => t.priority === 'urgent').length, color: chartColors.red },
      { label: t('tasks.high'), value: tasks.filter((t) => t.priority === 'high').length, color: chartColors.orange },
      { label: t('tasks.medium'), value: tasks.filter((t) => t.priority === 'medium').length, color: chartColors.yellow },
      { label: t('tasks.low'), value: tasks.filter((t) => t.priority === 'low' || !t.priority).length, color: chartColors.green },
    ].filter((item) => item.value > 0)

    // Tasks by status
    const tasksByStatus = [
      { label: t('tasks.pending'), value: tasks.filter((t) => t.status === 'pending').length, color: chartColors.teal },
      { label: t('tasks.inProgress'), value: tasks.filter((t) => t.status === 'in_progress').length, color: chartColors.blue },
      { label: t('tasks.done'), value: completedTasks.length, color: chartColors.green },
    ].filter((item) => item.value > 0)

    // Tasks by area
    const areaColors = [chartColors.violet, chartColors.blue, chartColors.green, chartColors.orange, chartColors.pink, chartColors.teal]
    const tasksByArea = areas
      .map((area, index) => ({
        label: area.name,
        value: tasks.filter((t) => t.areaId === area.id).length,
        color: area.color || areaColors[index % areaColors.length],
      }))
      .filter((item) => item.value > 0)

    // Add uncategorized tasks
    const uncategorizedCount = tasks.filter((t) => !t.areaId).length
    if (uncategorizedCount > 0) {
      tasksByArea.push({
        label: t('common.uncategorized'),
        value: uncategorizedCount,
        color: chartColors.teal,
      })
    }

    // Task completion trend (last 7 or 30 days)
    const trendDays = timeRange === 'week' ? 7 : 30
    const taskTrendData: { label: string; value: number }[] = []
    for (let i = trendDays - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const count = completedTasks.filter((task) => {
        if (!task.completedAt) return false
        return task.completedAt.split('T')[0] === dateStr
      }).length
      taskTrendData.push({
        label: timeRange === 'week'
          ? date.toLocaleDateString(locale, { weekday: 'short' }).slice(0, 3)
          : date.getDate().toString(),
        value: count,
      })
    }

    // Average tasks completed per day
    const daysWithCompletions = taskTrendData.filter((d) => d.value > 0).length
    const avgTasksPerDay = daysWithCompletions > 0
      ? (taskTrendData.reduce((sum, d) => sum + d.value, 0) / trendDays).toFixed(1)
      : '0'

    // Most productive day (by tasks completed)
    const completionsByDay: Record<number, number> = {}
    completedTasks.forEach((task) => {
      if (task.completedAt) {
        const dayOfWeek = new Date(task.completedAt).getDay()
        completionsByDay[dayOfWeek] = (completionsByDay[dayOfWeek] || 0) + 1
      }
    })
    const mostProductiveDayIndex = Object.entries(completionsByDay).reduce(
      (max, [day, count]) => (count > max.count ? { day: Number(day), count } : max),
      { day: -1, count: 0 }
    ).day
    const mostProductiveDay = mostProductiveDayIndex >= 0 ? getDayLabels(locale)[mostProductiveDayIndex] : null

    // Overdue tasks count
    const overdueTasks = tasks.filter((task) => {
      if (task.status === 'done' || !task.dueDate) return false
      return new Date(task.dueDate) < now
    }).length

    // Most consistent habit
    const habitsByCompletions = [...activeHabits].sort(
      (a, b) => b.completions.length - a.completions.length
    )
    const topHabit = habitsByCompletions[0]?.title || null

    // Trend data (last 7 days)
    const trendData: { label: string; value: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      let count = 0
      activeHabits.forEach((h) => {
        if (h.completions.some((c) => c.date === dateStr)) {
          count++
        }
      })
      trendData.push({
        label: date.toLocaleDateString(locale, { weekday: 'short' }).slice(0, 3),
        value: count,
      })
    }

    return {
      completionRate,
      currentPeriodCompletions,
      lastPeriodCompletions,
      dailyData,
      bestDay,
      maxStreak,
      completedTasks: completedTasks.length,
      pendingTasks: pendingTasks.length,
      currentWeekTasks,
      taskImprovement,
      tasksByPriority,
      tasksByStatus,
      tasksByArea,
      taskTrendData,
      avgTasksPerDay,
      mostProductiveDay,
      overdueTasks,
      topHabit,
      trendData,
      totalHabits: activeHabits.length,
    }
  }, [habits, tasks, areas, timeRange, locale, t])

  const hasData = analytics.totalHabits > 0 || tasks.length > 0

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen
        options={{
          title: t('analytics.title'),
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
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Time Range Selector */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)}>
          <TimeRangeSelector selected={timeRange} onSelect={setTimeRange} />
        </Animated.View>

        {!hasData ? (
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={[styles.emptyCard, { backgroundColor: colors.card }, cardShadow]}
          >
            <BarChart3 size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {t('analytics.noData')}
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
              {t('analytics.noDataDesc')}
            </Text>
          </Animated.View>
        ) : (
          <>
            {/* Quick Stats */}
            <View style={styles.statsGrid}>
              <StatCard
                icon={<Flame size={20} color={colors.warning} />}
                label={t('habits.streak')}
                value={analytics.maxStreak}
                subValue={t('habits.days')}
                color={colors.warning}
                delay={100}
              />
              <StatCard
                icon={<Target size={20} color={colors.accent} />}
                label={t('analytics.habits.completionRate')}
                value={`${analytics.completionRate}%`}
                color={colors.accent}
                delay={150}
              />
              <StatCard
                icon={<CheckCircle2 size={20} color={colors.success} />}
                label={t('analytics.tasks.completed')}
                value={analytics.completedTasks}
                color={colors.success}
                delay={200}
              />
              <StatCard
                icon={<Calendar size={20} color={colors.info} />}
                label={t('analytics.thisWeek')}
                value={analytics.currentWeekTasks}
                subValue={
                  analytics.taskImprovement > 0
                    ? `+${analytics.taskImprovement}%`
                    : analytics.taskImprovement < 0
                    ? `${analytics.taskImprovement}%`
                    : undefined
                }
                color={colors.info}
                delay={250}
              />
            </View>

            {/* Habit Completion Trend */}
            <Animated.View
              entering={FadeInDown.delay(300).duration(400)}
              style={[styles.card, { backgroundColor: colors.card }, cardShadow]}
            >
              <View style={styles.cardHeader}>
                <TrendingUp size={20} color={colors.accent} />
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                  {t('analytics.habits.trends')}
                </Text>
              </View>
              <View style={styles.chartContainer}>
                <LineChart
                  data={analytics.trendData}
                  height={160}
                  width={280}
                  color={colors.accent}
                  showGradient
                  showDots
                  showLabels
                  showGrid
                />
              </View>
            </Animated.View>

            {/* Daily Completions */}
            <Animated.View
              entering={FadeInDown.delay(350).duration(400)}
              style={[styles.card, { backgroundColor: colors.card }, cardShadow]}
            >
              <View style={styles.cardHeader}>
                <BarChart3 size={20} color={colors.success} />
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                  {t('analytics.habits.totalCompletions')}
                </Text>
              </View>
              <View style={styles.chartContainer}>
                <BarChart
                  data={analytics.dailyData.map((d) => ({
                    ...d,
                    color: colors.success,
                  }))}
                  height={140}
                  showLabels
                  showValues
                />
              </View>
              <View style={styles.bestDayRow}>
                <Text style={[styles.bestDayLabel, { color: colors.mutedForeground }]}>
                  {t('analytics.habits.bestDay')}:
                </Text>
                <Text style={[styles.bestDayValue, { color: colors.success }]}>
                  {analytics.bestDay}
                </Text>
              </View>
            </Animated.View>

            {/* Tasks by Priority */}
            {analytics.tasksByPriority.length > 0 && (
              <Animated.View
                entering={FadeInDown.delay(400).duration(400)}
                style={[styles.card, { backgroundColor: colors.card }, cardShadow]}
              >
                <View style={styles.cardHeader}>
                  <Target size={20} color={colors.info} />
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                    {t('analytics.tasks.byPriority')}
                  </Text>
                </View>
                <View style={styles.donutContainer}>
                  <DonutChart
                    data={analytics.tasksByPriority}
                    size={160}
                    thickness={24}
                    showLegend
                    showCenter
                    centerValue={String(tasks.length)}
                    centerLabel={t('tasks.title')}
                  />
                </View>
              </Animated.View>
            )}

            {/* Tasks by Status */}
            {analytics.tasksByStatus.length > 0 && (
              <Animated.View
                entering={FadeInDown.delay(425).duration(400)}
                style={[styles.card, { backgroundColor: colors.card }, cardShadow]}
              >
                <View style={styles.cardHeader}>
                  <ListTodo size={20} color={colors.accent} />
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                    {t('analytics.tasks.byStatus')}
                  </Text>
                </View>
                <View style={styles.chartContainer}>
                  <PieChart
                    data={analytics.tasksByStatus}
                    size={140}
                    showLegend
                  />
                </View>
              </Animated.View>
            )}

            {/* Tasks by Area */}
            {analytics.tasksByArea.length > 0 && (
              <Animated.View
                entering={FadeInDown.delay(450).duration(400)}
                style={[styles.card, { backgroundColor: colors.card }, cardShadow]}
              >
                <View style={styles.cardHeader}>
                  <FolderKanban size={20} color={colors.accent} />
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                    {t('analytics.tasks.byArea')}
                  </Text>
                </View>
                <View style={styles.donutContainer}>
                  <DonutChart
                    data={analytics.tasksByArea}
                    size={160}
                    thickness={24}
                    showLegend
                    showCenter
                    centerValue={String(tasks.length)}
                    centerLabel={t('tasks.title')}
                  />
                </View>
              </Animated.View>
            )}

            {/* Task Completion Trend */}
            {tasks.length > 0 && (
              <Animated.View
                entering={FadeInDown.delay(475).duration(400)}
                style={[styles.card, { backgroundColor: colors.card }, cardShadow]}
              >
                <View style={styles.cardHeader}>
                  <Clock size={20} color={colors.success} />
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                    {t('analytics.tasks.completionTrend')}
                  </Text>
                </View>
                <View style={styles.chartContainer}>
                  <LineChart
                    data={analytics.taskTrendData}
                    height={140}
                    width={280}
                    color={colors.success}
                    showGradient
                    showDots
                    showLabels
                    showGrid
                  />
                </View>
                <View style={styles.trendStatsRow}>
                  <View style={styles.trendStat}>
                    <Text style={[styles.trendStatValue, { color: colors.foreground }]}>
                      {analytics.avgTasksPerDay}
                    </Text>
                    <Text style={[styles.trendStatLabel, { color: colors.mutedForeground }]}>
                      {t('analytics.tasks.avgPerDay')}
                    </Text>
                  </View>
                  {analytics.mostProductiveDay && (
                    <View style={styles.trendStat}>
                      <Text style={[styles.trendStatValue, { color: colors.success }]}>
                        {analytics.mostProductiveDay}
                      </Text>
                      <Text style={[styles.trendStatLabel, { color: colors.mutedForeground }]}>
                        {t('analytics.tasks.mostProductiveDay')}
                      </Text>
                    </View>
                  )}
                </View>
              </Animated.View>
            )}

            {/* Insights */}
            <Animated.View
              entering={FadeInDown.delay(500).duration(400)}
              style={[styles.card, { backgroundColor: colors.card }, cardShadow]}
            >
              <View style={styles.cardHeader}>
                <Lightbulb size={20} color={colors.warning} />
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>
                  {t('analytics.insights.title')}
                </Text>
              </View>
              <View style={styles.insightsContainer}>
                {analytics.maxStreak > 0 && (
                  <View style={[styles.insightItem, { borderLeftColor: colors.warning }]}>
                    <Text style={[styles.insightText, { color: colors.foreground }]}>
                      {t('analytics.insights.habitStreak', { count: analytics.maxStreak })}
                    </Text>
                  </View>
                )}
                {analytics.taskImprovement !== 0 && (
                  <View
                    style={[
                      styles.insightItem,
                      { borderLeftColor: analytics.taskImprovement > 0 ? colors.success : colors.error },
                    ]}
                  >
                    <Text style={[styles.insightText, { color: colors.foreground }]}>
                      {analytics.taskImprovement > 0
                        ? t('analytics.insights.taskCompletion', { percent: analytics.taskImprovement })
                        : t('analytics.insights.improvement', { area: t('tasks.title') })}
                    </Text>
                  </View>
                )}
                {analytics.overdueTasks > 0 && (
                  <View style={[styles.insightItem, { borderLeftColor: colors.error }]}>
                    <Text style={[styles.insightText, { color: colors.foreground }]}>
                      {t('analytics.insights.overdueTasks', { count: analytics.overdueTasks })}
                    </Text>
                  </View>
                )}
                {analytics.mostProductiveDay && (
                  <View style={[styles.insightItem, { borderLeftColor: colors.success }]}>
                    <Text style={[styles.insightText, { color: colors.foreground }]}>
                      {t('analytics.insights.productiveDay', { day: analytics.mostProductiveDay })}
                    </Text>
                  </View>
                )}
                {analytics.topHabit && (
                  <View style={[styles.insightItem, { borderLeftColor: colors.accent }]}>
                    <Text style={[styles.insightText, { color: colors.foreground }]}>
                      {t('analytics.insights.topHabit', { habit: analytics.topHabit })}
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>
          </>
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
  rangeSelector: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    padding: spacing[1],
    marginTop: spacing[4],
    marginBottom: spacing[4],
  },
  rangeOption: {
    flex: 1,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radius.md,
    alignItems: 'center',
  },
  rangeOptionText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  statCard: {
    width: '48%',
    padding: spacing[4],
    borderRadius: radius.xl,
    alignItems: 'center',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  statValue: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
  },
  statLabel: {
    fontSize: typography.size.xs,
    marginTop: spacing[0.5],
    textAlign: 'center',
  },
  statSubValue: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    marginTop: spacing[1],
  },
  card: {
    padding: spacing[5],
    borderRadius: radius.xl,
    marginBottom: spacing[4],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  cardTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
  chartContainer: {
    alignItems: 'center',
  },
  donutContainer: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  bestDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  bestDayLabel: {
    fontSize: typography.size.sm,
  },
  bestDayValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  trendStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing[4],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 128, 128, 0.1)',
  },
  trendStat: {
    alignItems: 'center',
  },
  trendStatValue: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  trendStatLabel: {
    fontSize: typography.size.xs,
    marginTop: spacing[0.5],
    textAlign: 'center',
  },
  insightsContainer: {
    gap: spacing[3],
  },
  insightItem: {
    paddingLeft: spacing[3],
    borderLeftWidth: 3,
  },
  insightText: {
    fontSize: typography.size.sm,
    lineHeight: 20,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
    borderRadius: radius.xl,
    marginTop: spacing[4],
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
  },
})
