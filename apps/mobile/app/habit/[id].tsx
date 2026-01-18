import { useState, useMemo, useCallback } from 'react'
import { View, Text, Pressable, StyleSheet, ScrollView, Alert, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Edit3,
  Archive,
  ArchiveRestore,
  Trash2,
  Flame,
  TrendingUp,
  Calendar,
  CheckCircle2,
} from 'lucide-react-native'
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated'
import { useTheme, cardShadow, spacing, radius, typography } from '@/theme'
import {
  useHabitQuery,
  useDeleteHabit,
  useArchiveHabit,
  useUnarchiveHabit,
  useToggleHabitCompletion,
  useSetCompletionValue,
} from '@/hooks'
import { HabitFormModal, QuantityInputModal } from '@/components/habits'

const SCREEN_WIDTH = Dimensions.get('window').width
const CELL_SIZE = Math.floor((SCREEN_WIDTH - 48 - 12 * 6) / 53) // 53 weeks, some padding
const CELL_GAP = 2

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

function calculateStreak(completions: Array<{ date: string }>): number {
  if (!completions || completions.length === 0) return 0

  const dates = completions.map((c) => c.date).sort((a, b) => b.localeCompare(a))
  const today = getTodayString()
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

function calculateBestStreak(completions: Array<{ date: string }>): number {
  if (!completions || completions.length === 0) return 0

  const dates = [...new Set(completions.map((c) => c.date))].sort()
  let maxStreak = 1
  let currentStreak = 1

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1])
    const curr = new Date(dates[i])
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000)

    if (diffDays === 1) {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
    } else {
      currentStreak = 1
    }
  }

  return maxStreak
}

function getYearDates(): string[][] {
  const today = new Date()
  const weeks: string[][] = []

  // Start from 52 weeks ago
  const start = new Date(today)
  start.setDate(start.getDate() - 364)

  // Adjust to start of week (Sunday)
  while (start.getDay() !== 0) {
    start.setDate(start.getDate() - 1)
  }

  let currentWeek: string[] = []
  const endDate = new Date(today)

  while (start <= endDate || currentWeek.length > 0) {
    if (start <= endDate) {
      currentWeek.push(start.toISOString().split('T')[0])
      start.setDate(start.getDate() + 1)
    }

    if (currentWeek.length === 7 || start > endDate) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  return weeks
}

interface YearHeatmapProps {
  completions: Array<{ date: string; value: number }>
  color: string
  isQuantitative: boolean
  target: number
}

function YearHeatmap({ completions, color, isQuantitative, target }: YearHeatmapProps) {
  const { colors } = useTheme()
  const weeks = useMemo(() => getYearDates(), [])
  const today = getTodayString()

  const completionMap = useMemo(() => {
    const map = new Map<string, number>()
    completions.forEach((c) => {
      map.set(c.date, c.value)
    })
    return map
  }, [completions])

  const getOpacity = (value: number): number => {
    if (isQuantitative && target > 0) {
      const ratio = Math.min(value / target, 1)
      return 0.2 + ratio * 0.8
    }
    return value > 0 ? 1 : 0
  }

  return (
    <View style={styles.heatmapContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.heatmapScroll}
      >
        <View style={styles.heatmapGrid}>
          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.heatmapWeek}>
              {week.map((date) => {
                const value = completionMap.get(date) ?? 0
                const isToday = date === today
                const isFuture = date > today

                return (
                  <View
                    key={date}
                    style={[
                      styles.heatmapCell,
                      {
                        backgroundColor: isFuture
                          ? 'transparent'
                          : value > 0
                          ? color
                          : colors.muted,
                        opacity: isFuture ? 0.3 : getOpacity(value),
                        borderWidth: isToday ? 2 : 0,
                        borderColor: isToday ? colors.foreground : 'transparent',
                      },
                    ]}
                  />
                )
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={styles.heatmapLegend}>
        <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Less</Text>
        <View style={[styles.legendCell, { backgroundColor: colors.muted }]} />
        <View style={[styles.legendCell, { backgroundColor: color, opacity: 0.4 }]} />
        <View style={[styles.legendCell, { backgroundColor: color, opacity: 0.7 }]} />
        <View style={[styles.legendCell, { backgroundColor: color }]} />
        <Text style={[styles.legendText, { color: colors.mutedForeground }]}>More</Text>
      </View>
    </View>
  )
}

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { t } = useTranslation()
  const { colors } = useTheme()

  const { data: habit, isLoading } = useHabitQuery(id)
  const deleteHabit = useDeleteHabit()
  const archiveHabit = useArchiveHabit()
  const unarchiveHabit = useUnarchiveHabit()
  const toggleCompletion = useToggleHabitCompletion()
  const setCompletionValue = useSetCompletionValue()

  const [showEditModal, setShowEditModal] = useState(false)
  const [showQuantityModal, setShowQuantityModal] = useState(false)

  const today = getTodayString()
  const todayCompletion = habit?.completions.find((c) => c.date === today)
  const isCompletedToday = !!todayCompletion

  const isQuantitative = habit?.tracking.type === 'quantitative'
  const target = habit?.tracking.type === 'quantitative' ? habit.tracking.target : 1
  const unit = habit?.tracking.type === 'quantitative' ? habit.tracking.unit : ''
  const currentValue = todayCompletion?.value ?? 0
  const progress = isQuantitative && target > 0 ? Math.min((currentValue / target) * 100, 100) : 0
  const isTargetMet = isQuantitative ? currentValue >= target : isCompletedToday

  const streak = useMemo(() => (habit ? calculateStreak(habit.completions) : 0), [habit])
  const bestStreak = useMemo(() => (habit ? calculateBestStreak(habit.completions) : 0), [habit])
  const totalCompletions = useMemo(() => habit?.completions.length ?? 0, [habit])

  const handleBack = useCallback(() => {
    router.back()
  }, [])

  const handleEdit = useCallback(() => {
    setShowEditModal(true)
  }, [])

  const handleArchive = useCallback(() => {
    if (!habit) return

    const action = habit.archivedAt ? unarchiveHabit : archiveHabit
    const confirmMessage = habit.archivedAt
      ? t('habits.unarchiveConfirm')
      : t('habits.archiveConfirm')

    Alert.alert(
      habit.archivedAt ? t('habits.unarchive') : t('habits.archive'),
      confirmMessage,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          onPress: () => action.mutate(habit.id),
        },
      ]
    )
  }, [habit, archiveHabit, unarchiveHabit, t])

  const handleDelete = useCallback(() => {
    if (!habit) return

    Alert.alert(t('common.delete'), t('habits.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteHabit.mutateAsync(habit.id)
          router.back()
        },
      },
    ])
  }, [habit, deleteHabit, t])

  const handleToggle = useCallback(() => {
    if (!habit) return

    if (isQuantitative) {
      setShowQuantityModal(true)
    } else {
      toggleCompletion.mutate({ habitId: habit.id, date: today })
    }
  }, [habit, isQuantitative, toggleCompletion, today])

  const handleQuantitySubmit = useCallback(
    (value: number) => {
      if (!habit) return
      setCompletionValue.mutate({ habitId: habit.id, date: today, value })
    },
    [habit, setCompletionValue, today]
  )

  if (isLoading || !habit) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            {t('common.loading')}
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  const isArchived = !!habit.archivedAt

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
          <Pressable onPress={handleBack} style={styles.headerButton} hitSlop={8}>
            <ArrowLeft size={24} color={colors.foreground} />
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable onPress={handleEdit} style={styles.headerButton} hitSlop={8}>
              <Edit3 size={20} color={colors.foreground} />
            </Pressable>
            <Pressable onPress={handleArchive} style={styles.headerButton} hitSlop={8}>
              {isArchived ? (
                <ArchiveRestore size={20} color={colors.foreground} />
              ) : (
                <Archive size={20} color={colors.foreground} />
              )}
            </Pressable>
            <Pressable onPress={handleDelete} style={styles.headerButton} hitSlop={8}>
              <Trash2 size={20} color={colors.error} />
            </Pressable>
          </View>
        </Animated.View>

        {/* Habit Info */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.infoSection}>
          <View style={[styles.colorIndicator, { backgroundColor: habit.color }]} />
          <Text style={[styles.habitTitle, { color: colors.foreground }]}>{habit.title}</Text>
          {habit.description && (
            <Text style={[styles.habitDescription, { color: colors.mutedForeground }]}>
              {habit.description}
            </Text>
          )}
          {isArchived && (
            <View style={[styles.archivedBadge, { backgroundColor: colors.warning + '20' }]}>
              <Archive size={14} color={colors.warning} />
              <Text style={[styles.archivedText, { color: colors.warning }]}>
                {t('habits.archived')}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Today's Progress */}
        {!isArchived && (
          <Animated.View
            entering={FadeInDown.delay(150).duration(400)}
            style={[styles.todayCard, { backgroundColor: colors.card }, cardShadow]}
          >
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {t('habits.today')}
            </Text>

            {isQuantitative && (
              <View style={styles.quantitativeProgress}>
                <View style={styles.progressRow}>
                  <TrendingUp size={16} color={habit.color} />
                  <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
                    {currentValue} / {target} {unit}
                  </Text>
                  <Text style={[styles.percentText, { color: habit.color }]}>
                    {Math.round(progress)}%
                  </Text>
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: colors.muted }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { backgroundColor: habit.color, width: `${progress}%` },
                    ]}
                  />
                </View>
              </View>
            )}

            <Pressable
              onPress={handleToggle}
              style={[
                styles.todayButton,
                {
                  backgroundColor: isTargetMet ? habit.color : colors.secondary,
                },
              ]}
            >
              <CheckCircle2
                size={22}
                color={isTargetMet ? colors.white : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.todayButtonText,
                  { color: isTargetMet ? colors.white : colors.foreground },
                ]}
              >
                {isQuantitative
                  ? isTargetMet
                    ? t('habits.complete')
                    : t('habits.addValue')
                  : isTargetMet
                  ? t('habits.completed')
                  : t('habits.markComplete')}
              </Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Statistics */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={[styles.statsCard, { backgroundColor: colors.card }, cardShadow]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t('habits.statistics')}
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${colors.warning}20` }]}>
                <Flame size={20} color={colors.warning} />
              </View>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{streak}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                {t('habits.streak')}
              </Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${colors.success}20` }]}>
                <TrendingUp size={20} color={colors.success} />
              </View>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{bestStreak}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                {t('habits.bestStreak')}
              </Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: `${colors.accent}20` }]}>
                <Calendar size={20} color={colors.accent} />
              </View>
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {totalCompletions}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                {t('habits.totalCompletions')}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Year Heatmap */}
        <Animated.View
          entering={FadeInDown.delay(250).duration(400)}
          style={[styles.heatmapCard, { backgroundColor: colors.card }, cardShadow]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t('habits.thisYear')}
          </Text>
          <YearHeatmap
            completions={habit.completions}
            color={habit.color}
            isQuantitative={isQuantitative}
            target={target}
          />
        </Animated.View>
      </ScrollView>

      {/* Edit Modal */}
      <HabitFormModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        habit={habit}
      />

      {/* Quantity Input Modal */}
      {isQuantitative && (
        <QuantityInputModal
          visible={showQuantityModal}
          onClose={() => setShowQuantityModal(false)}
          onSubmit={handleQuantitySubmit}
          habitTitle={habit.title}
          currentValue={currentValue}
          target={target}
          unit={unit}
          color={habit.color}
        />
      )}
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
    paddingBottom: spacing[8],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: typography.size.base,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
  },

  // Info Section
  infoSection: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[6],
  },
  colorIndicator: {
    width: 48,
    height: 6,
    borderRadius: radius.full,
    marginBottom: spacing[3],
  },
  habitTitle: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
  },
  habitDescription: {
    fontSize: typography.size.base,
    marginTop: spacing[2],
    lineHeight: 24,
  },
  archivedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing[1.5],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: radius.full,
    marginTop: spacing[3],
  },
  archivedText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },

  // Today Card
  todayCard: {
    marginHorizontal: spacing[6],
    marginBottom: spacing[4],
    padding: spacing[5],
    borderRadius: radius['2xl'],
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing[4],
  },
  quantitativeProgress: {
    marginBottom: spacing[4],
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  progressText: {
    fontSize: typography.size.sm,
    flex: 1,
  },
  percentText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  progressBarBg: {
    height: 8,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
    borderRadius: radius.xl,
  },
  todayButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },

  // Stats Card
  statsCard: {
    marginHorizontal: spacing[6],
    marginBottom: spacing[4],
    padding: spacing[5],
    borderRadius: radius['2xl'],
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
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
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
  },
  statLabel: {
    fontSize: typography.size.xs,
    marginTop: spacing[0.5],
    textAlign: 'center',
  },

  // Heatmap Card
  heatmapCard: {
    marginHorizontal: spacing[6],
    marginBottom: spacing[4],
    padding: spacing[5],
    borderRadius: radius['2xl'],
  },
  heatmapContainer: {
    // Container for heatmap
  },
  heatmapScroll: {
    paddingRight: spacing[2],
  },
  heatmapGrid: {
    flexDirection: 'row',
    gap: CELL_GAP,
  },
  heatmapWeek: {
    flexDirection: 'column',
    gap: CELL_GAP,
  },
  heatmapCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 2,
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing[1.5],
    marginTop: spacing[3],
  },
  legendText: {
    fontSize: typography.size.xs,
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
})
