import { ReactNode } from 'react'
import { StyleSheet, ScrollView, ViewStyle, ScrollViewProps } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '@/theme'

interface SafeAreaScreenProps extends Omit<ScrollViewProps, 'style' | 'contentContainerStyle'> {
  children: ReactNode
  scrollable?: boolean
  style?: ViewStyle
  contentStyle?: ViewStyle
}

/**
 * Reusable screen wrapper with SafeArea handling
 * Ensures consistent spacing on all edges including notches and home indicators
 */
export function SafeAreaScreen({
  children,
  scrollable = true,
  style,
  contentStyle,
  ...scrollViewProps
}: SafeAreaScreenProps) {
  const { colors } = useTheme()

  const containerStyle = [
    styles.container,
    { backgroundColor: colors.background },
    style,
  ]

  if (scrollable) {
    return (
      <SafeAreaView style={containerStyle} edges={['top', 'left', 'right']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, contentStyle]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          {...scrollViewProps}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[containerStyle, contentStyle]}>
      {children}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
})
