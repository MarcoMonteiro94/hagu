import { View, Text, StyleSheet } from 'react-native'
import Svg, { Circle, G } from 'react-native-svg'
import Animated, { FadeIn } from 'react-native-reanimated'
import { useTheme, spacing, typography } from '@/theme'

// =============================================================================
// Types
// =============================================================================

interface ProgressRingProps {
  progress: number // 0-100
  size?: number
  strokeWidth?: number
  color?: string
  backgroundColor?: string
  showPercentage?: boolean
  showValue?: boolean
  value?: string
  label?: string
  animated?: boolean
}

// =============================================================================
// Component
// =============================================================================

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 10,
  color,
  backgroundColor,
  showPercentage = true,
  showValue = false,
  value,
  label,
  animated = true,
}: ProgressRingProps) {
  const { colors } = useTheme()
  const ringColor = color || colors.accent
  const bgColor = backgroundColor || colors.muted

  const center = size / 2
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (Math.min(progress, 100) / 100) * circumference

  return (
    <Animated.View
      entering={animated ? FadeIn.duration(400) : undefined}
      style={styles.container}
    >
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${center}, ${center}`}>
            {/* Background circle */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={bgColor}
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Progress circle */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={ringColor}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </G>
        </Svg>

        {/* Center content */}
        <View style={styles.centerContent}>
          {showValue && value && (
            <Text style={[styles.valueText, { color: colors.foreground }]}>
              {value}
            </Text>
          )}
          {showPercentage && !showValue && (
            <Text style={[styles.percentageText, { color: colors.foreground }]}>
              {Math.round(progress)}%
            </Text>
          )}
          {label && (
            <Text style={[styles.labelText, { color: colors.mutedForeground }]}>
              {label}
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  )
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  centerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: typography.size.xl,
    fontWeight: '700',
  },
  valueText: {
    fontSize: typography.size.lg,
    fontWeight: '600',
  },
  labelText: {
    fontSize: typography.size.xs,
    marginTop: spacing[0.5],
    textAlign: 'center',
  },
})
