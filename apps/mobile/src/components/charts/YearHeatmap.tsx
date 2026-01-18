import { useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'
import { useTranslation } from 'react-i18next'
import { useTheme, spacing, radius, typography } from '@/theme'

// =============================================================================
// Types
// =============================================================================

interface CompletionData {
  date: string
  value: number
}

interface YearHeatmapProps {
  completions: CompletionData[]
  color: string
  weeks?: number
  cellSize?: number
  gap?: number
  isQuantitative?: boolean
  target?: number
  unit?: string
  onDayPress?: (date: string, value: number) => void
  showMonthLabels?: boolean
  showDayLabels?: boolean
  showLegend?: boolean
}

// =============================================================================
// Helpers
// =============================================================================

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

function getMonthLabel(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, { month: 'short' })
}

function formatDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function generateYearData(weeks: number, locale: string): {
  days: { date: string; dayOfWeek: number; value: number }[]
  months: { label: string; weekIndex: number }[]
  columns: ({ date: string; dayOfWeek: number; value: number } | null)[][]
} {
  const totalDays = weeks * 7
  const days: { date: string; dayOfWeek: number; value: number }[] = []
  const monthLabels: { label: string; weekIndex: number }[] = []

  let lastMonth = -1
  let weekIndex = 0

  for (let i = totalDays - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const dayOfWeek = date.getDay()
    const month = date.getMonth()

    // Track month changes for labels
    if (month !== lastMonth && dayOfWeek === 0) {
      monthLabels.push({
        label: getMonthLabel(date, locale),
        weekIndex,
      })
      lastMonth = month
    }

    if (dayOfWeek === 6) {
      weekIndex++
    }

    days.push({
      date: dateStr,
      dayOfWeek,
      value: 0,
    })
  }

  // Group days into weeks (columns)
  const columns: (typeof days[number] | null)[][] = []
  let currentColumn: (typeof days[number] | null)[] = []

  // Find the first day and pad to start from Sunday
  if (days.length > 0) {
    const firstDayOfWeek = days[0].dayOfWeek
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentColumn.push(null)
    }
  }

  days.forEach((day) => {
    currentColumn.push(day)
    if (day.dayOfWeek === 6) {
      columns.push(currentColumn)
      currentColumn = []
    }
  })

  // Push remaining days
  if (currentColumn.length > 0) {
    while (currentColumn.length < 7) {
      currentColumn.push(null)
    }
    columns.push(currentColumn)
  }

  return { days, months: monthLabels, columns }
}

// =============================================================================
// Component
// =============================================================================

export function YearHeatmap({
  completions,
  color,
  weeks = 52,
  cellSize = 10,
  gap = 2,
  isQuantitative = false,
  target = 1,
  unit = '',
  onDayPress,
  showMonthLabels = true,
  showDayLabels = true,
  showLegend = true,
}: YearHeatmapProps) {
  const { t, i18n } = useTranslation()
  const { colors } = useTheme()
  const locale = i18n.language

  const completionMap = useMemo(() => {
    const map = new Map<string, number>()
    completions.forEach((c) => {
      map.set(c.date, c.value)
    })
    return map
  }, [completions])

  const { months, columns } = useMemo(
    () => generateYearData(weeks, locale),
    [weeks, locale]
  )

  const today = getTodayString()
  const totalCompletions = completions.length

  // Calculate max value for intensity scaling
  const maxValue = useMemo(() => {
    return Math.max(1, ...Array.from(completionMap.values()).filter((v) => v > 0))
  }, [completionMap])

  const getIntensity = (value: number): number => {
    if (value === 0) return 0
    if (!isQuantitative) return 1
    // For quantitative, scale from 0.3 to 1 based on value vs target
    const actualTarget = target || maxValue
    return Math.min(1, Math.max(0.3, value / actualTarget))
  }

  const dayLabels =
    locale === 'pt-BR'
      ? ['Dom', '', 'Ter', '', 'Qui', '', 'Sáb']
      : ['Sun', '', 'Tue', '', 'Thu', '', 'Sat']

  const dayLabelWidth = showDayLabels ? 28 : 0

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      {/* Month labels */}
      {showMonthLabels && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.monthsContainer, { paddingLeft: dayLabelWidth + gap }]}
          scrollEnabled={false}
        >
          {months.map((month, i) => {
            const nextMonth = months[i + 1]
            const weeksSpan = nextMonth
              ? nextMonth.weekIndex - month.weekIndex
              : columns.length - month.weekIndex
            const width = weeksSpan * (cellSize + gap) - gap

            return (
              <Text
                key={`${month.label}-${month.weekIndex}`}
                style={[
                  styles.monthLabel,
                  { color: colors.mutedForeground, width, minWidth: width },
                ]}
                numberOfLines={1}
              >
                {month.label}
              </Text>
            )
          })}
        </ScrollView>
      )}

      {/* Heatmap grid */}
      <View style={styles.gridWrapper}>
        {/* Day labels */}
        {showDayLabels && (
          <View style={[styles.dayLabelsContainer, { gap }]}>
            {dayLabels.map((label, i) => (
              <View
                key={i}
                style={[styles.dayLabelCell, { height: cellSize, width: dayLabelWidth }]}
              >
                <Text style={[styles.dayLabel, { color: colors.mutedForeground }]}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Grid */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={[styles.gridContainer, { gap }]}>
            {columns.map((column, colIndex) => (
              <View key={colIndex} style={[styles.column, { gap }]}>
                {column.map((day, dayIndex) => {
                  if (!day) {
                    return (
                      <View
                        key={`empty-${colIndex}-${dayIndex}`}
                        style={{ width: cellSize, height: cellSize }}
                      />
                    )
                  }

                  const value = completionMap.get(day.date) ?? 0
                  const intensity = getIntensity(value)
                  const isCompleted = value > 0
                  const isToday = day.date === today
                  const isFuture = day.date > today

                  return (
                    <Pressable
                      key={day.date}
                      onPress={() => onDayPress?.(day.date, value)}
                      disabled={!onDayPress}
                      style={[
                        styles.cell,
                        {
                          width: cellSize,
                          height: cellSize,
                          backgroundColor: isFuture
                            ? 'transparent'
                            : isCompleted
                            ? color
                            : colors.muted,
                          opacity: isFuture ? 0.15 : isCompleted ? intensity : 0.2,
                          borderWidth: isToday ? 1.5 : 0,
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
      </View>

      {/* Legend */}
      {showLegend && (
        <View style={styles.legendContainer}>
          <Text style={[styles.legendInfo, { color: colors.mutedForeground }]}>
            {totalCompletions} {t('habits.completionsThisYear')}
          </Text>
          <View style={styles.legendScale}>
            <Text style={[styles.legendText, { color: colors.mutedForeground }]}>
              {t('common.less')}
            </Text>
            <View style={[styles.legendCell, { backgroundColor: colors.muted, opacity: 0.2 }]} />
            {[0.3, 0.5, 0.7, 1].map((opacity) => (
              <View
                key={opacity}
                style={[styles.legendCell, { backgroundColor: color, opacity }]}
              />
            ))}
            <Text style={[styles.legendText, { color: colors.mutedForeground }]}>
              {t('common.more')}
            </Text>
          </View>
        </View>
      )}
    </Animated.View>
  )
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    // Container
  },
  monthsContainer: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: spacing[1],
  },
  monthLabel: {
    fontSize: typography.size.xs,
    textTransform: 'capitalize',
  },
  gridWrapper: {
    flexDirection: 'row',
  },
  dayLabelsContainer: {
    flexDirection: 'column',
  },
  dayLabelCell: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: spacing[1],
  },
  dayLabel: {
    fontSize: 10,
  },
  scrollContent: {
    paddingRight: spacing[2],
  },
  gridContainer: {
    flexDirection: 'row',
  },
  column: {
    flexDirection: 'column',
  },
  cell: {
    borderRadius: 2,
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[3],
  },
  legendInfo: {
    fontSize: typography.size.xs,
  },
  legendScale: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  legendText: {
    fontSize: typography.size.xs,
  },
  legendCell: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
})
