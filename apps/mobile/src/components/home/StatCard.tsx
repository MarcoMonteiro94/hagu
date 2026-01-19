import React, { ReactNode } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTheme, cardShadow } from '@/theme'

interface StatCardProps {
  icon: ReactNode
  label: string
  value: string | number
  suffix?: string
  iconBgColor: string
  delay?: number
}

/**
 * StatCard - A compact card for displaying statistics
 * Used in the Bento Grid for streak, level, progress, etc.
 */
export function StatCard({
  icon,
  label,
  value,
  suffix,
  iconBgColor,
  delay = 0,
}: StatCardProps) {
  const { colors } = useTheme()

  return (
    <View
     
      style={[
        styles.container,
        { backgroundColor: colors.card },
        cardShadow,
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
        {icon}
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.label, { color: colors.mutedForeground }]}>
          {label}
        </Text>
        <View style={styles.valueContainer}>
          <Text style={[styles.value, { color: colors.foreground }]}>
            {value}
          </Text>
          {suffix && (
            <Text style={[styles.suffix, { color: colors.mutedForeground }]}>
              {suffix}
            </Text>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 12,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
  },
  suffix: {
    fontSize: 14,
    fontWeight: '400',
  },
})
