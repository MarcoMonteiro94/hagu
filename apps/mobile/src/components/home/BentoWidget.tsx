import React, { ReactNode } from 'react'
import { View, StyleSheet, useWindowDimensions } from 'react-native'
import type { WidgetSize } from '@/types'

interface BentoWidgetProps {
  children: ReactNode
  size?: WidgetSize
  index?: number
  gap?: number
}

/**
 * BentoWidget - A responsive widget wrapper that adapts its size based on the size prop
 *
 * Size behavior:
 * - small: 1 column, 1 row
 * - medium: 2 columns, 1 row (on tablet+)
 * - large: 2 columns, 2 rows (on tablet+)
 * - wide: 2 columns, 1 row (full width on mobile)
 *
 * On mobile (< 768px), all widgets take full width
 */
export function BentoWidget({
  children,
  size = 'medium',
  index = 0,
  gap = 12,
}: BentoWidgetProps) {
  const { width: screenWidth } = useWindowDimensions()

  // On mobile, all widgets are full width
  const isMobile = screenWidth < 768
  const isTablet = screenWidth >= 768 && screenWidth < 1024

  // Calculate width based on size and screen width
  const getWidth = () => {
    if (isMobile) {
      return screenWidth - 48 // Full width minus padding
    }

    const containerWidth = screenWidth - 48 // Container padding
    const numColumns = isTablet ? 2 : 4

    switch (size) {
      case 'small':
        // 1 column
        return (containerWidth - gap * (numColumns - 1)) / numColumns
      case 'medium':
        // 2 columns on tablet/desktop
        return isTablet
          ? containerWidth
          : (containerWidth - gap * (numColumns - 1)) / numColumns * 2 + gap
      case 'large':
        // 2 columns
        return isTablet
          ? containerWidth
          : (containerWidth - gap * (numColumns - 1)) / numColumns * 2 + gap
      case 'wide':
        // Full width on mobile, 2 columns on tablet+
        return isTablet
          ? containerWidth
          : (containerWidth - gap * (numColumns - 1)) / numColumns * 2 + gap
      default:
        return containerWidth
    }
  }

  const animationDelay = index * 80

  return (
    <View
     
      style={[
        styles.widget,
        {
          width: getWidth(),
          marginBottom: gap,
        },
      ]}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  widget: {
    // Base styles - content will define the height
  },
})
