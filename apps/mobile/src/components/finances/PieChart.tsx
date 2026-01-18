import { View, Text, StyleSheet } from 'react-native'
import Svg, { Path, G } from 'react-native-svg'
import Animated, { FadeIn } from 'react-native-reanimated'
import { useTheme, spacing, typography } from '@/theme'

interface PieChartData {
  label: string
  value: number
  color: string
}

interface PieChartProps {
  data: PieChartData[]
  size?: number
  innerRadius?: number
  showLegend?: boolean
  formatValue?: (value: number) => string
}

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

function createArcPath(
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const start = polarToCartesian(x, y, radius, endAngle)
  const end = polarToCartesian(x, y, radius, startAngle)
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'

  return [
    'M',
    start.x,
    start.y,
    'A',
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
    'L',
    x,
    y,
    'Z',
  ].join(' ')
}

export function PieChart({
  data,
  size = 200,
  innerRadius = 0,
  showLegend = true,
  formatValue = (v) => v.toFixed(0),
}: PieChartProps) {
  const { colors } = useTheme()
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const radius = size / 2
  const center = radius

  if (total === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Svg width={size} height={size}>
          <Path
            d={createArcPath(center, center, radius - 10, 0, 359.99)}
            fill={colors.muted}
          />
        </Svg>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Sem dados
        </Text>
      </View>
    )
  }

  let currentAngle = 0
  const slices = data.map((item) => {
    const sliceAngle = (item.value / total) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + sliceAngle
    currentAngle = endAngle
    return {
      ...item,
      startAngle,
      endAngle,
      percentage: (item.value / total) * 100,
    }
  })

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      <View style={styles.chartContainer}>
        <Svg width={size} height={size}>
          <G>
            {slices.map((slice, index) => {
              // Handle full circle case
              if (slice.endAngle - slice.startAngle >= 359.99) {
                return (
                  <Path
                    key={index}
                    d={createArcPath(
                      center,
                      center,
                      radius - 10,
                      0,
                      359.99
                    )}
                    fill={slice.color}
                  />
                )
              }
              return (
                <Path
                  key={index}
                  d={createArcPath(
                    center,
                    center,
                    radius - 10,
                    slice.startAngle,
                    slice.endAngle
                  )}
                  fill={slice.color}
                />
              )
            })}
            {innerRadius > 0 && (
              <Path
                d={createArcPath(center, center, innerRadius, 0, 359.99)}
                fill={colors.background}
              />
            )}
          </G>
        </Svg>
      </View>

      {showLegend && (
        <View style={styles.legendContainer}>
          {slices.map((slice, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
              <Text
                style={[styles.legendLabel, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {slice.label}
              </Text>
              <Text style={[styles.legendValue, { color: colors.mutedForeground }]}>
                {slice.percentage.toFixed(1)}%
              </Text>
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  )
}

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
    position: 'absolute',
    fontSize: typography.size.sm,
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
