import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Platform,
  Vibration,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated'
import { Trophy, Zap, X, Sparkles } from 'lucide-react-native'
import { useTheme, spacing, radius, typography } from '@/theme'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// Achievement notification data
interface AchievementNotification {
  id: string
  type: string
  name: string
  description: string
  xpReward: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

// Context
interface AchievementNotificationContextType {
  showAchievement: (achievement: AchievementNotification) => void
}

const AchievementNotificationContext = createContext<AchievementNotificationContextType | null>(null)

export function useAchievementNotification() {
  const context = useContext(AchievementNotificationContext)
  if (!context) {
    throw new Error('useAchievementNotification must be used within AchievementNotificationProvider')
  }
  return context
}

// Rarity colors
const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  rare: '#3b82f6',
  epic: '#8b5cf6',
  legendary: '#eab308',
}

// Provider component
interface AchievementNotificationProviderProps {
  children: React.ReactNode
}

export function AchievementNotificationProvider({ children }: AchievementNotificationProviderProps) {
  const { colors } = useTheme()
  const [notification, setNotification] = useState<AchievementNotification | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Animation values
  const translateY = useSharedValue(-200)
  const scale = useSharedValue(0.8)
  const opacity = useSharedValue(0)
  const starScale = useSharedValue(0)
  const glowOpacity = useSharedValue(0)

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }))

  const animatedStarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: starScale.value }],
  }))

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }))

  const hideNotification = useCallback(() => {
    translateY.value = withTiming(-200, { duration: 300, easing: Easing.inOut(Easing.ease) })
    scale.value = withTiming(0.8, { duration: 300 })
    opacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(setIsVisible)(false)
      runOnJS(setNotification)(null)
    })
  }, [translateY, scale, opacity])

  const showAchievement = useCallback(
    (achievement: AchievementNotification) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      setNotification(achievement)
      setIsVisible(true)

      // Trigger haptic feedback
      if (Platform.OS !== 'web') {
        Vibration.vibrate([0, 50, 100, 50])
      }

      // Animate in
      translateY.value = withSpring(0, { damping: 15, stiffness: 150 })
      scale.value = withSpring(1, { damping: 12, stiffness: 150 })
      opacity.value = withTiming(1, { duration: 300 })

      // Star animation
      starScale.value = withSequence(
        withTiming(0, { duration: 0 }),
        withSpring(1.2, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 10 })
      )

      // Glow animation
      glowOpacity.value = withSequence(
        withTiming(0.8, { duration: 200 }),
        withTiming(0.3, { duration: 300 })
      )

      // Auto hide after 4 seconds
      timeoutRef.current = setTimeout(() => {
        hideNotification()
      }, 4000)
    },
    [translateY, scale, opacity, starScale, glowOpacity, hideNotification]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const rarityColor = notification ? RARITY_COLORS[notification.rarity] : colors.accent

  return (
    <AchievementNotificationContext.Provider value={{ showAchievement }}>
      {children}

      {/* Notification Toast */}
      {isVisible && notification && (
        <View style={styles.overlay} pointerEvents="box-none">
          <Animated.View style={[styles.container, animatedContainerStyle]}>
            {/* Glow effect */}
            <Animated.View
              style={[
                styles.glow,
                { backgroundColor: rarityColor },
                animatedGlowStyle,
              ]}
            />

            <View style={[styles.content, { backgroundColor: colors.card }]}>
              {/* Close button */}
              <Pressable style={styles.closeButton} onPress={hideNotification} hitSlop={8}>
                <X size={16} color={colors.mutedForeground} />
              </Pressable>

              {/* Icon */}
              <View style={styles.iconContainer}>
                <View style={[styles.iconBg, { backgroundColor: rarityColor + '20' }]}>
                  <Animated.View style={animatedStarStyle}>
                    <Trophy size={32} color={rarityColor} />
                  </Animated.View>
                </View>
                {/* Sparkle decorations */}
                <Sparkles
                  size={16}
                  color={rarityColor}
                  style={[styles.sparkle, styles.sparkle1]}
                />
                <Sparkles
                  size={12}
                  color={rarityColor}
                  style={[styles.sparkle, styles.sparkle2]}
                />
              </View>

              {/* Text content */}
              <View style={styles.textContent}>
                <Text style={[styles.title, { color: colors.foreground }]}>
                  Achievement Unlocked!
                </Text>
                <Text style={[styles.achievementName, { color: rarityColor }]}>
                  {notification.name}
                </Text>
                <Text style={[styles.description, { color: colors.mutedForeground }]}>
                  {notification.description}
                </Text>
              </View>

              {/* XP Badge */}
              <View style={[styles.xpBadge, { backgroundColor: rarityColor + '20' }]}>
                <Zap size={14} color={rarityColor} />
                <Text style={[styles.xpText, { color: rarityColor }]}>
                  +{notification.xpReward} XP
                </Text>
              </View>

              {/* Rarity indicator */}
              <View style={[styles.rarityBar, { backgroundColor: rarityColor }]} />
            </View>
          </Animated.View>
        </View>
      )}
    </AchievementNotificationContext.Provider>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 60,
    zIndex: 9999,
  },
  container: {
    width: SCREEN_WIDTH - 32,
    maxWidth: 400,
  },
  glow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: radius['2xl'] + 20,
    opacity: 0.3,
  },
  content: {
    borderRadius: radius['2xl'],
    padding: spacing[5],
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: spacing[3],
    right: spacing[3],
    zIndex: 1,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: spacing[3],
  },
  iconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
  },
  sparkle1: {
    top: -4,
    right: -8,
  },
  sparkle2: {
    bottom: 4,
    left: -6,
  },
  textContent: {
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  title: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing[1],
  },
  achievementName: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    marginBottom: spacing[1],
    textAlign: 'center',
  },
  description: {
    fontSize: typography.size.sm,
    textAlign: 'center',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: radius.full,
  },
  xpText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
  },
  rarityBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    borderBottomLeftRadius: radius['2xl'],
    borderBottomRightRadius: radius['2xl'],
  },
})
