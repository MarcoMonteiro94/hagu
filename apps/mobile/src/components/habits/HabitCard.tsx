import { useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Circle, Flame, TrendingUp } from 'lucide-react-native'
import { useTheme, cardShadow, spacing, radius, typography } from '@/theme'
import { QuantityInputModal } from './QuantityInputModal'
import type { Habit, HabitCompletion } from '@hagu/core'

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

function getFrequencyLabel(habit: Habit, t: (key: string) => string): string {
  switch (habit.frequency.type) {
    case 'daily':
      return t('habits.frequencyDaily')
    case 'weekly':
      return `${habit.frequency.daysPerWeek}x/${t('habits.week')}`
    case 'specificDays':
      return t('habits.frequencySpecificDays')
    case 'monthly':
      return `${habit.frequency.timesPerMonth}x/${t('habits.month')}`
    default:
      return ''
  }
}

export interface HabitCardProps {
  habit: Habit & { streak?: number }
  last7Days: string[]
  onToggle: (habitId: string, value?: number) => void
  onPress?: (habit: Habit) => void
  index: number
}

export function HabitCard({ habit, last7Days, onToggle, onPress, index }: HabitCardProps) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const [showQuantityModal, setShowQuantityModal] = useState(false)

  const today = getTodayString()
  const todayCompletion = habit.completions.find((c) => c.date === today)
  const isCompletedToday = !!todayCompletion

  const isQuantitative = habit.tracking.type === 'quantitative'
  const target = habit.tracking.type === 'quantitative' ? habit.tracking.target : 1
  const unit = habit.tracking.type === 'quantitative' ? habit.tracking.unit : ''
  const currentValue = todayCompletion?.value ?? 0

  // Calculate progress for quantitative habits
  const progress = isQuantitative && target > 0 ? Math.min((currentValue / target) * 100, 100) : 0
  const isTargetMet = isQuantitative ? currentValue >= target : isCompletedToday

  const streak = habit.streak ?? 0

  const handleTogglePress = () => {
    if (isQuantitative) {
      setShowQuantityModal(true)
    } else {
      onToggle(habit.id)
    }
  }

  const handleQuantitySubmit = (value: number) => {
    onToggle(habit.id, value)
  }

  return (
    <>
      <Pressable onPress={() => onPress?.(habit)}>
        <View
         
          style={[styles.habitCard, { backgroundColor: colors.card }, cardShadow]}
        >
          {/* Color accent */}
          <View style={[styles.habitAccent, { backgroundColor: habit.color }]} />

          <View style={styles.habitContent}>
            {/* Header */}
            <View style={styles.habitHeader}>
              <View style={styles.habitTitleRow}>
                <View style={styles.titleContainer}>
                  <Text
                    style={[
                      styles.habitTitle,
                      { color: colors.foreground },
                      isTargetMet && styles.habitTitleCompleted,
                    ]}
                    numberOfLines={1}
                  >
                    {habit.title}
                  </Text>
                  {/* Frequency badge */}
                  {habit.frequency.type !== 'daily' && (
                    <View style={[styles.frequencyBadge, { backgroundColor: `${habit.color}20` }]}>
                      <Text style={[styles.frequencyText, { color: habit.color }]}>
                        {getFrequencyLabel(habit, t)}
                      </Text>
                    </View>
                  )}
                </View>
                {streak > 0 && (
                  <View style={[styles.streakBadge, { backgroundColor: `${colors.warning}20` }]}>
                    <Flame size={12} color={colors.warning} />
                    <Text style={[styles.streakText, { color: colors.warning }]}>
                      {streak}
                    </Text>
                  </View>
                )}
              </View>
              {habit.description && (
                <Text
                  style={[styles.habitDescription, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {habit.description}
                </Text>
              )}
            </View>

            {/* Quantitative Progress Bar */}
            {isQuantitative && (
              <View style={styles.quantitativeSection}>
                <View style={styles.progressRow}>
                  <TrendingUp size={14} color={habit.color} />
                  <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
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
                      {
                        backgroundColor: habit.color,
                        width: `${progress}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            )}

            {/* Heatmap (last 7 days) - only for non-quantitative */}
            {!isQuantitative && (
              <View style={styles.heatmapContainer}>
                {last7Days.map((date) => {
                  const completion = habit.completions.find((c) => c.date === date)
                  const isCompleted = !!completion
                  const isToday = date === today

                  return (
                    <View
                      key={date}
                      style={[
                        styles.heatmapDot,
                        {
                          backgroundColor: isCompleted
                            ? habit.color
                            : isToday
                            ? `${colors.mutedForeground}40`
                            : colors.muted,
                          borderWidth: isToday ? 2 : 0,
                          borderColor: isToday ? habit.color : 'transparent',
                        },
                      ]}
                    />
                  )
                })}
              </View>
            )}

            {/* Toggle button */}
            <Pressable
              onPress={handleTogglePress}
              style={[
                styles.toggleButton,
                {
                  backgroundColor: isTargetMet ? `${habit.color}20` : colors.secondary,
                  borderColor: isTargetMet ? habit.color : 'transparent',
                  borderWidth: isTargetMet ? 1 : 0,
                },
              ]}
              hitSlop={8}
            >
              {isTargetMet ? (
                <CheckCircle2 size={20} color={habit.color} />
              ) : (
                <Circle size={20} color={colors.mutedForeground} />
              )}
              <Text
                style={[
                  styles.toggleText,
                  { color: isTargetMet ? habit.color : colors.mutedForeground },
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
          </View>
        </View>
      </Pressable>

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
    </>
  )
}

const styles = StyleSheet.create({
  // Habit Card
  habitCard: {
    marginHorizontal: spacing[6],
    marginBottom: spacing[3],
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    flexDirection: 'row',
  },
  habitAccent: {
    width: 4,
  },
  habitContent: {
    flex: 1,
    padding: spacing[4],
  },
  habitHeader: {
    marginBottom: spacing[3],
  },
  habitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  habitTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    flexShrink: 1,
  },
  habitTitleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  habitDescription: {
    fontSize: typography.size.sm,
    marginTop: spacing[0.5],
  },
  frequencyBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: radius.md,
  },
  frequencyText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
    marginLeft: spacing[2],
  },
  streakText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },

  // Quantitative Progress
  quantitativeSection: {
    marginBottom: spacing[3],
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  progressLabel: {
    fontSize: typography.size.sm,
    flex: 1,
  },
  percentText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
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

  // Heatmap
  heatmapContainer: {
    flexDirection: 'row',
    gap: spacing[1.5],
    marginBottom: spacing[3],
  },
  heatmapDot: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
  },

  // Toggle Button
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2.5],
    paddingHorizontal: spacing[4],
    borderRadius: radius.xl,
  },
  toggleText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
})
