import { useState, useCallback, useMemo } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { router } from 'expo-router'
import {
  Plus,
  Target,
  Flame,
  Archive,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useTheme, cardShadow, spacing, radius, typography } from '@/theme'
import { HabitCard, HabitFormModal } from '@/components/habits'
import {
  useHabitsQuery,
  useToggleHabitCompletion,
  useSetCompletionValue,
} from '@/hooks'
import type { Habit } from '@hagu/core'

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date.toISOString().split('T')[0]
  })
}

function calculateStreak(completions: Array<{ date: string }>): number {
  if (!completions || completions.length === 0) return 0

  const dates = completions.map((c) => c.date).sort((a, b) => b.localeCompare(a))
  const today = getTodayString()
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  // Check if there's a completion today or yesterday
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

function EmptyState({ onAdd }: { onAdd: () => void }) {
  const { t } = useTranslation()
  const { colors } = useTheme()

  return (
    <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.emptyState}>
      <View style={[styles.emptyIconContainer, { backgroundColor: `${colors.accent}15` }]}>
        <Target size={48} color={colors.accent} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        {t('habits.noHabits')}
      </Text>
      <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
        {t('habits.emptyDescription')}
      </Text>
      <Pressable
        onPress={onAdd}
        style={[styles.emptyButton, { backgroundColor: colors.accent }]}
      >
        <Plus size={20} color={colors.white} />
        <Text style={styles.emptyButtonText}>{t('habits.createFirst')}</Text>
      </Pressable>
    </Animated.View>
  )
}

export default function HabitsScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const { data: habits = [], isLoading, refetch } = useHabitsQuery()
  const toggleCompletion = useToggleHabitCompletion()
  const setCompletionValue = useSetCompletionValue()

  const last7Days = getLast7Days()

  // Separate active and archived habits
  const activeHabits = useMemo(
    () => habits.filter((h) => !h.archivedAt),
    [habits]
  )

  const archivedHabits = useMemo(
    () => habits.filter((h) => !!h.archivedAt),
    [habits]
  )

  const completedToday = useMemo(
    () =>
      activeHabits.filter((h) =>
        h.completions.some((c) => c.date === getTodayString())
      ).length,
    [activeHabits]
  )

  const maxStreak = useMemo(() => {
    return activeHabits.reduce((max, habit) => {
      const streak = calculateStreak(habit.completions)
      return Math.max(max, streak)
    }, 0)
  }, [activeHabits])

  const handleAddHabit = useCallback(() => {
    setEditingHabit(null)
    setShowFormModal(true)
  }, [])

  const handleHabitPress = useCallback((habit: Habit) => {
    // Navigate to habit detail page
    router.push(`/habit/${habit.id}`)
  }, [])

  const handleCloseModal = useCallback(() => {
    setShowFormModal(false)
    setEditingHabit(null)
  }, [])

  const handleToggleHabit = useCallback(
    (habitId: string, value?: number) => {
      const today = getTodayString()
      const habit = habits.find((h) => h.id === habitId)

      if (habit?.tracking.type === 'quantitative' && value !== undefined) {
        setCompletionValue.mutate({ habitId, date: today, value })
      } else {
        toggleCompletion.mutate({ habitId, date: today })
      }
    },
    [toggleCompletion, setCompletionValue, habits]
  )

  const toggleShowArchived = useCallback(() => {
    setShowArchived((prev) => !prev)
  }, [])

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
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
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {t('habits.title')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {activeHabits.length > 0
                ? `${activeHabits.length} ${activeHabits.length === 1 ? t('habits.active') : t('habits.actives')}`
                : ''}
            </Text>
          </View>
          <Pressable
            onPress={handleAddHabit}
            style={[styles.addButton, { backgroundColor: colors.accent }]}
          >
            <Plus size={22} color={colors.white} />
          </Pressable>
        </Animated.View>

        {/* Progress Card */}
        {activeHabits.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={[styles.progressCard, { backgroundColor: colors.card }, cardShadow]}
          >
            <View style={styles.progressRow}>
              <View style={styles.progressItem}>
                <Text style={[styles.progressValue, { color: colors.foreground }]}>
                  {completedToday}/{activeHabits.length}
                </Text>
                <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
                  {t('habits.completedToday')}
                </Text>
              </View>
              <View style={[styles.progressDivider, { backgroundColor: colors.border }]} />
              <View style={styles.progressItem}>
                <View style={styles.progressValueRow}>
                  <Flame size={18} color={colors.warning} />
                  <Text style={[styles.progressValue, { color: colors.foreground }]}>
                    {maxStreak}
                  </Text>
                </View>
                <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
                  {t('habits.streak')}
                </Text>
              </View>
            </View>

            {/* Progress bar */}
            <View style={[styles.progressBarBg, { backgroundColor: colors.muted }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: colors.accent,
                    width: `${activeHabits.length > 0 ? (completedToday / activeHabits.length) * 100 : 0}%`,
                  },
                ]}
              />
            </View>
          </Animated.View>
        )}

        {/* Habits List or Empty State */}
        {activeHabits.length === 0 ? (
          <EmptyState onAdd={handleAddHabit} />
        ) : (
          <View style={styles.habitsList}>
            {activeHabits.map((habit, index) => (
              <HabitCard
                key={habit.id}
                habit={{ ...habit, streak: calculateStreak(habit.completions) }}
                last7Days={last7Days}
                onToggle={handleToggleHabit}
                onPress={handleHabitPress}
                index={index}
              />
            ))}
          </View>
        )}

        {/* Archived Habits Section */}
        {archivedHabits.length > 0 && (
          <View style={styles.archivedSection}>
            <Pressable
              onPress={toggleShowArchived}
              style={[styles.archivedHeader, { backgroundColor: colors.secondary }]}
            >
              <View style={styles.archivedHeaderLeft}>
                <Archive size={18} color={colors.mutedForeground} />
                <Text style={[styles.archivedHeaderText, { color: colors.mutedForeground }]}>
                  {t('habits.archivedHabits')} ({archivedHabits.length})
                </Text>
              </View>
              {showArchived ? (
                <ChevronUp size={20} color={colors.mutedForeground} />
              ) : (
                <ChevronDown size={20} color={colors.mutedForeground} />
              )}
            </Pressable>

            {showArchived && (
              <Animated.View entering={FadeInDown.duration(300)} style={styles.archivedList}>
                {archivedHabits.map((habit, index) => (
                  <Pressable
                    key={habit.id}
                    onPress={() => handleHabitPress(habit)}
                    style={[styles.archivedCard, { backgroundColor: colors.card }, cardShadow]}
                  >
                    <View style={[styles.archivedAccent, { backgroundColor: habit.color, opacity: 0.5 }]} />
                    <View style={styles.archivedContent}>
                      <Text
                        style={[styles.archivedTitle, { color: colors.mutedForeground }]}
                        numberOfLines={1}
                      >
                        {habit.title}
                      </Text>
                      <Text style={[styles.archivedMeta, { color: colors.mutedForeground }]}>
                        {t('habits.archived')}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </Animated.View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Habit Form Modal */}
      <HabitFormModal visible={showFormModal} onClose={handleCloseModal} habit={editingHabit ?? undefined} />
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
    paddingBottom: spacing[8],
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
  },
  subtitle: {
    fontSize: typography.size.sm,
    marginTop: spacing[1],
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Progress Card
  progressCard: {
    marginHorizontal: spacing[6],
    marginBottom: spacing[6],
    padding: spacing[4],
    borderRadius: radius['2xl'],
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  progressItem: {
    flex: 1,
    alignItems: 'center',
  },
  progressDivider: {
    width: 1,
    height: 40,
  },
  progressValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  progressValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
  },
  progressLabel: {
    fontSize: typography.size.xs,
    marginTop: spacing[0.5],
  },
  progressBarBg: {
    height: 6,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radius.full,
  },

  // Habits List
  habitsList: {
    paddingTop: spacing[2],
  },

  // Archived Section
  archivedSection: {
    marginTop: spacing[6],
    paddingHorizontal: spacing[6],
  },
  archivedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
  },
  archivedHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  archivedHeaderText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  archivedList: {
    marginTop: spacing[3],
    gap: spacing[2],
  },
  archivedCard: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  archivedAccent: {
    width: 4,
  },
  archivedContent: {
    flex: 1,
    padding: spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  archivedTitle: {
    fontSize: typography.size.sm,
    flex: 1,
  },
  archivedMeta: {
    fontSize: typography.size.xs,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[12],
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[6],
  },
  emptyTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: typography.size.base,
    textAlign: 'center',
    marginTop: spacing[2],
    lineHeight: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3.5],
    borderRadius: radius.xl,
    marginTop: spacing[6],
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
})
