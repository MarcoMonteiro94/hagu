import { ReactNode } from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { spacing } from '@/theme'

interface SafeAreaModalFooterProps {
  children: ReactNode
  style?: ViewStyle
  minPadding?: number
}

/**
 * Footer wrapper for modals with SafeArea bottom padding
 * Ensures action buttons don't overlap with home indicators or navigation bars
 */
export function SafeAreaModalFooter({
  children,
  style,
  minPadding = spacing[6],
}: SafeAreaModalFooterProps) {
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        styles.footer,
        { paddingBottom: Math.max(insets.bottom, minPadding) },
        style,
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  footer: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
  },
})
