import { View, Text, StyleSheet, Pressable } from 'react-native'
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated'
import { useTheme, spacing, radius, typography } from '@/theme'

// =============================================================================
// Types
// =============================================================================

export interface BarChartData {
  label: string
  value: number
  color?: string
}

interface BarChartProps {
  data: BarChartData[]
  maxValue?: number
  height?: number
  showLabels?: boolean
  showValues?: boolean
  formatValue?: (value: number) => string
  onBarPress?: (item: BarChartData, index: number) => void
  animated?: boolean
  horizontal?: boolean
  barWidth?: number | 'auto'
}

// =============================================================================
// Component
// =============================================================================

export function BarChart({
  data,
  maxValue: providedMax,
  height = 200,
  showLabels = true,
  showValues = false,
  formatValue = (v) => v.toLocaleString(),
  onBarPress,
  animated = true,
  horizontal = false,
  barWidth = 'auto',
}: BarChartProps) {
  const { colors } = useTheme()
  const maxValue = providedMax ?? Math.max(...data.map((d) => d.value), 1)

  if (horizontal) {
    return (
      <Animated.View
        entering={animated ? FadeIn.duration(400) : undefined}
        style={styles.horizontalContainer}
      >
        {data.map((item, index) => {
          const barWidthPercent = (item.value / maxValue) * 100
          const Wrapper = animated ? Animated.View : View

          return (
            <Wrapper
              key={item.label}
              entering={animated ? FadeInDown.delay(index * 80).duration(400) : undefined}
              style={styles.horizontalRow}
            >
              {showLabels && (
                <Text
                  style={[styles.horizontalLabel, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              )}
              <View style={[styles.horizontalBarBg, { backgroundColor: colors.muted }]}>
                <Pressable
                  onPress={() => onBarPress?.(item, index)}
                  disabled={!onBarPress}
                  style={[
                    styles.horizontalBar,
                    {
                      width: `${Math.max(barWidthPercent, 2)}%`,
                      backgroundColor: item.color || colors.accent,
                    },
                  ]}
                />
              </View>
              {showValues && (
                <Text style={[styles.horizontalValue, { color: colors.mutedForeground }]}>
                  {formatValue(item.value)}
                </Text>
              )}
            </Wrapper>
          )
        })}
      </Animated.View>
    )
  }

  return (
    <Animated.View
      entering={animated ? FadeIn.duration(400) : undefined}
      style={[styles.container, { height }]}
    >
      <View style={styles.barsContainer}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * (height - 40)
          const Wrapper = animated ? Animated.View : View

          return (
            <Wrapper
              key={item.label}
              entering={animated ? FadeInDown.delay(index * 80).duration(400) : undefined}
              style={[
                styles.barWrapper,
                barWidth !== 'auto' && { width: barWidth, flex: 0 },
              ]}
            >
              <Pressable
                onPress={() => onBarPress?.(item, index)}
                disabled={!onBarPress}
                style={styles.barContainer}
              >
                {showValues && (
                  <Text style={[styles.valueLabel, { color: colors.mutedForeground }]}>
                    {formatValue(item.value)}
                  </Text>
                )}
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(barHeight, 4),
                      backgroundColor: item.color || colors.accent,
                    },
                    barWidth !== 'auto' && { width: barWidth - 8 },
                  ]}
                />
              </Pressable>
              {showLabels && (
                <Text
                  style={[styles.label, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              )}
            </Wrapper>
          )
        })}
      </View>
    </Animated.View>
  )
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[2],
    paddingBottom: spacing[6],
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  barContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '60%',
    borderRadius: radius.md,
    minHeight: 4,
  },
  label: {
    position: 'absolute',
    bottom: 0,
    fontSize: typography.size.xs,
    textAlign: 'center',
  },
  valueLabel: {
    fontSize: typography.size.xs,
    marginBottom: spacing[1],
  },
  // Horizontal styles
  horizontalContainer: {
    width: '100%',
    gap: spacing[3],
  },
  horizontalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  horizontalLabel: {
    fontSize: typography.size.sm,
    width: 80,
  },
  horizontalBarBg: {
    flex: 1,
    height: 24,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  horizontalBar: {
    height: '100%',
    borderRadius: radius.md,
  },
  horizontalValue: {
    fontSize: typography.size.sm,
    width: 60,
    textAlign: 'right',
  },
})
