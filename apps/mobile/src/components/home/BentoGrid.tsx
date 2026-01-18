import React, { ReactNode } from 'react'
import { View, StyleSheet, useWindowDimensions } from 'react-native'

interface BentoGridProps {
  children: ReactNode
  gap?: number
}

/**
 * BentoGrid - A responsive grid container for bento-style layouts
 *
 * - Mobile: Single column layout
 * - Tablet (width >= 768): 2-column layout
 * - Desktop/Large tablet (width >= 1024): 4-column layout
 */
export function BentoGrid({ children, gap = 12 }: BentoGridProps) {
  const { width } = useWindowDimensions()

  // Determine number of columns based on screen width
  const numColumns = width >= 1024 ? 4 : width >= 768 ? 2 : 1

  return (
    <View style={[styles.container, { gap }]}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
})
