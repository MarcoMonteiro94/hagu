import { View, Text, StyleSheet, Pressable } from 'react-native'
import Svg, { Path, G } from 'react-native-svg'
import Animated, { FadeIn } from 'react-native-reanimated'
import { useTheme, spacing, typography } from '@/theme'

// =============================================================================
// Types
// =============================================================================

export interface DonutChartData {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  data: DonutChartData[]
  size?: number
  thickness?: number
  showLegend?: boolean
  showCenter?: boolean
  centerLabel?: string
  centerValue?: string
  formatValue?: (value: number) => string
  onSlicePress?: (item: DonutChartData & { percentage: number }, index: number) => void
  animated?: boolean
  emptyText?: string
}

// =============================================================================
// Helpers
// =============================================================================

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  }
}

function createDonutArcPath(
  x: number,
  y: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number
): string {
  const outerStart = polarToCartesian(x, y, outerRadius, endAngle)
  const outerEnd = polarToCartesian(x, y, outerRadius, startAngle)
  const innerStart = polarToCartesian(x, y, innerRadius, startAngle)
  const innerEnd = polarToCartesian(x, y, innerRadius, endAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

  return [
    'M', outerStart.x, outerStart.y,
    'A', outerRadius, outerRadius, 0, largeArcFlag, 0, outerEnd.x, outerEnd.y,
    'L', innerStart.x, innerStart.y,
    'A', innerRadius, innerRadius, 0, largeArcFlag, 1, innerEnd.x, innerEnd.y,
    'Z',
  ].join(' ')
}

// =============================================================================
// Component
// =============================================================================

export function DonutChart({
  data,
  size = 200,
  thickness = 30,
  showLegend = true,
  showCenter = true,
  centerLabel,
  centerValue,
  formatValue = (v) => v.toFixed(0),
  onSlicePress,
  animated = true,
  emptyText = 'No data',
}: DonutChartProps) {
  const { colors } = useTheme()
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const center = size / 2
  const outerRadius = size / 2 - 10
  const innerRadius = outerRadius - thickness

  if (total === 0) {
    return (
      <Animated.View
        entering={animated ? FadeIn.duration(400) : undefined}
        style={styles.emptyContainer}
      >
        <Svg width={size} height={size}>
          <Path
            d={createDonutArcPath(center, center, outerRadius, innerRadius, 0, 359.99)}
            fill={colors.muted}
          />
        </Svg>
        <View style={[styles.centerContent, { width: innerRadius * 2, height: innerRadius * 2 }]}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {emptyText}
          </Text>
        </View>
      </Animated.View>
    )
  }

  let currentAngle = 0
  const slices = data.map((item) => {
    const sliceAngle = (item.value / total) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + sliceAngle - 1 // Small gap between slices
    currentAngle = currentAngle + sliceAngle
    return {
      ...item,
      startAngle,
      endAngle: Math.max(endAngle, startAngle + 1),
      percentage: (item.value / total) * 100,
    }
  })

  return (
    <Animated.View
      entering={animated ? FadeIn.duration(400) : undefined}
      style={styles.container}
    >
      <View style={styles.chartContainer}>
        <Svg width={size} height={size}>
          <G>
            {slices.map((slice, index) => {
              // Handle full circle case
              if (slice.percentage >= 99.9) {
                return (
                  <Path
                    key={index}
                    d={createDonutArcPath(center, center, outerRadius, innerRadius, 0, 359.99)}
                    fill={slice.color}
                    onPress={() => onSlicePress?.(slice, index)}
                  />
                )
              }
              return (
                <Path
                  key={index}
                  d={createDonutArcPath(
                    center,
                    center,
                    outerRadius,
                    innerRadius,
                    slice.startAngle,
                    slice.endAngle
                  )}
                  fill={slice.color}
                  onPress={() => onSlicePress?.(slice, index)}
                />
              )
            })}
          </G>
        </Svg>

        {/* Center content */}
        {showCenter && (
          <View
            style={[
              styles.centerContent,
              {
                width: innerRadius * 2 - 10,
                height: innerRadius * 2 - 10,
              },
            ]}
          >
            {centerValue && (
              <Text style={[styles.centerValue, { color: colors.foreground }]}>
                {centerValue}
              </Text>
            )}
            {centerLabel && (
              <Text style={[styles.centerLabel, { color: colors.mutedForeground }]}>
                {centerLabel}
              </Text>
            )}
          </View>
        )}
      </View>

      {showLegend && (
        <View style={styles.legendContainer}>
          {slices.map((slice, index) => (
            <Pressable
              key={index}
              onPress={() => onSlicePress?.(slice, index)}
              disabled={!onSlicePress}
              style={styles.legendItem}
            >
              <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
              <Text
                style={[styles.legendLabel, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {slice.label}
              </Text>
              <Text style={[styles.legendValue, { color: colors.mutedForeground }]}>
                {slice.percentage.toFixed(0)}%
              </Text>
            </Pressable>
          ))}
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
    alignItems: 'center',
    gap: spacing[4],
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: typography.size.sm,
    textAlign: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerValue: {
    fontSize: typography.size['2xl'],
    fontWeight: '700',
  },
  centerLabel: {
    fontSize: typography.size.xs,
    marginTop: spacing[0.5],
  },
  legendContainer: {
    width: '100%',
    gap: spacing[2],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    flex: 1,
    fontSize: typography.size.sm,
  },
  legendValue: {
    fontSize: typography.size.sm,
    fontWeight: '500',
  },
})
