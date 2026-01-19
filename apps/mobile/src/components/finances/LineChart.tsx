import { View, Text, StyleSheet } from 'react-native'
import Svg, { Path, Line, Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg'
import { useTheme, spacing, typography } from '@/theme'

interface LineChartData {
  label: string
  value: number
}

interface LineChartProps {
  data: LineChartData[]
  height?: number
  color?: string
  showGradient?: boolean
  showDots?: boolean
  showLabels?: boolean
}

function createSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return ''

  let path = `M ${points[0].x} ${points[0].y}`

  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i]
    const next = points[i + 1]
    const midX = (current.x + next.x) / 2

    path += ` C ${midX} ${current.y}, ${midX} ${next.y}, ${next.x} ${next.y}`
  }

  return path
}

export function LineChart({
  data,
  height = 200,
  color,
  showGradient = true,
  showDots = true,
  showLabels = true,
}: LineChartProps) {
  const { colors } = useTheme()
  const chartColor = color || colors.accent

  const padding = { top: 20, right: 20, bottom: 30, left: 20 }
  const chartWidth = 300
  const chartHeight = height - padding.top - padding.bottom

  const maxValue = Math.max(...data.map((d) => d.value), 1)
  const minValue = Math.min(...data.map((d) => d.value), 0)
  const valueRange = maxValue - minValue || 1

  const points = data.map((item, index) => ({
    x: padding.left + (index / Math.max(data.length - 1, 1)) * (chartWidth - padding.left - padding.right),
    y: padding.top + chartHeight - ((item.value - minValue) / valueRange) * chartHeight,
  }))

  const linePath = createSmoothPath(points)

  // Create gradient fill path
  const gradientPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`
      : ''

  return (
    <View style={[styles.container, { height }]}>
      <Svg width={chartWidth} height={height}>
        <Defs>
          <LinearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={chartColor} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={chartColor} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        <G>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
            <Line
              key={index}
              x1={padding.left}
              y1={padding.top + chartHeight * ratio}
              x2={chartWidth - padding.right}
              y2={padding.top + chartHeight * ratio}
              stroke={colors.border}
              strokeWidth={1}
              strokeDasharray="4,4"
            />
          ))}
        </G>

        {/* Gradient fill */}
        {showGradient && gradientPath && (
          <Path d={gradientPath} fill="url(#gradient)" />
        )}

        {/* Line */}
        {linePath && (
          <Path d={linePath} stroke={chartColor} strokeWidth={3} fill="none" />
        )}

        {/* Dots */}
        {showDots &&
          points.map((point, index) => (
            <G key={index}>
              <Circle
                cx={point.x}
                cy={point.y}
                r={6}
                fill={colors.background}
                stroke={chartColor}
                strokeWidth={2}
              />
            </G>
          ))}
      </Svg>

      {/* Labels */}
      {showLabels && (
        <View style={[styles.labelsContainer, { paddingHorizontal: padding.left }]}>
          {data.map((item, index) => (
            <Text
              key={index}
              style={[
                styles.label,
                { color: colors.mutedForeground },
                index === 0 && styles.labelFirst,
                index === data.length - 1 && styles.labelLast,
              ]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 300,
    marginTop: -spacing[6],
  },
  label: {
    fontSize: typography.size.xs,
    textAlign: 'center',
    flex: 1,
  },
  labelFirst: {
    textAlign: 'left',
  },
  labelLast: {
    textAlign: 'right',
  },
})
