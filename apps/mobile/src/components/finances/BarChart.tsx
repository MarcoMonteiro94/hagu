import { View, Text, StyleSheet } from 'react-native'
import { useTheme, spacing, radius, typography } from '@/theme'

interface BarChartData {
  label: string
  value: number
  color?: string
}

interface BarChartProps {
  data: BarChartData[]
  maxValue?: number
  height?: number
  showLabels?: boolean
  formatValue?: (value: number) => string
}

export function BarChart({
  data,
  maxValue: providedMax,
  height = 200,
  showLabels = true,
  formatValue = (v) => v.toString(),
}: BarChartProps) {
  const { colors } = useTheme()
  const maxValue = providedMax ?? Math.max(...data.map((d) => d.value), 1)

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.barsContainer}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * (height - 40)
          return (
            <View
              key={item.label}
             
              style={styles.barWrapper}
            >
              <View style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(barHeight, 4),
                      backgroundColor: item.color || colors.accent,
                    },
                  ]}
                />
              </View>
              {showLabels && (
                <Text
                  style={[styles.label, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              )}
            </View>
          )
        })}
      </View>
    </View>
  )
}

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
})
