'use client'

import { motion, useInView, useMotionValue, useSpring, type HTMLMotionProps } from 'framer-motion'
import { forwardRef, useRef, useEffect, useCallback } from 'react'

// Fade in animation
export const FadeIn = forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
  ({ children, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </motion.div>
  )
)
FadeIn.displayName = 'FadeIn'

// Slide up animation
export const SlideUp = forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
  ({ children, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </motion.div>
  )
)
SlideUp.displayName = 'SlideUp'

// Scale animation for cards
export const ScaleIn = forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
  ({ children, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </motion.div>
  )
)
ScaleIn.displayName = 'ScaleIn'

// Stagger container for list animations
interface StaggerContainerProps extends HTMLMotionProps<'div'> {
  staggerDelay?: number
}

export const StaggerContainer = forwardRef<HTMLDivElement, StaggerContainerProps>(
  ({ children, staggerDelay = 0.05, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
)
StaggerContainer.displayName = 'StaggerContainer'

// Stagger item for list items
export const StaggerItem = forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
  ({ children, ...props }, ref) => (
    <motion.div
      ref={ref}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      {...props}
    >
      {children}
    </motion.div>
  )
)
StaggerItem.displayName = 'StaggerItem'

// Tap animation wrapper
export const TapScale = forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
  ({ children, ...props }, ref) => (
    <motion.div
      ref={ref}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.1 }}
      {...props}
    >
      {children}
    </motion.div>
  )
)
TapScale.displayName = 'TapScale'

// Hover scale animation
export const HoverScale = forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
  ({ children, ...props }, ref) => (
    <motion.div
      ref={ref}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </motion.div>
  )
)
HoverScale.displayName = 'HoverScale'

// Page transition wrapper
export const PageTransition = forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
  ({ children, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      {...props}
    >
      {children}
    </motion.div>
  )
)
PageTransition.displayName = 'PageTransition'

// Pulse animation (for badges, notifications)
export const Pulse = forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
  ({ children, ...props }, ref) => (
    <motion.div
      ref={ref}
      animate={{
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
)
Pulse.displayName = 'Pulse'

// Shake animation (for errors)
export const Shake = forwardRef<HTMLDivElement, HTMLMotionProps<'div'> & { trigger?: boolean }>(
  ({ children, trigger, ...props }, ref) => (
    <motion.div
      ref={ref}
      animate={trigger ? { x: [-5, 5, -5, 5, 0] } : {}}
      transition={{ duration: 0.4 }}
      {...props}
    >
      {children}
    </motion.div>
  )
)
Shake.displayName = 'Shake'

// Checkmark animation
export const CheckmarkAnimation = ({ className }: { className?: string }) => (
  <motion.svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={3}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <motion.path
      d="M5 13l4 4L19 7"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    />
  </motion.svg>
)

// Animated number counter (based on ReactBits CountUp)
interface CountUpProps {
  to: number
  from?: number
  direction?: 'up' | 'down'
  delay?: number
  duration?: number
  className?: string
  startWhen?: boolean
  separator?: string
  onStart?: () => void
  onEnd?: () => void
}

export function CountUp({
  to,
  from = 0,
  direction = 'up',
  delay = 0,
  duration = 2,
  className = '',
  startWhen = true,
  separator = '',
  onStart,
  onEnd,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(direction === 'down' ? to : from)

  const damping = 20 + 40 * (1 / duration)
  const stiffness = 100 * (1 / duration)

  const springValue = useSpring(motionValue, { damping, stiffness })
  const isInView = useInView(ref, { once: true, margin: '0px' })

  const formatValue = useCallback(
    (latest: number) => {
      const formatted = Math.round(latest).toString()
      return separator ? formatted.replace(/\B(?=(\d{3})+(?!\d))/g, separator) : formatted
    },
    [separator]
  )

  useEffect(() => {
    if (ref.current) {
      ref.current.textContent = formatValue(direction === 'down' ? to : from)
    }
  }, [from, to, direction, formatValue])

  useEffect(() => {
    if (isInView && startWhen) {
      onStart?.()

      const timeoutId = setTimeout(() => {
        motionValue.set(direction === 'down' ? from : to)
      }, delay * 1000)

      const durationTimeoutId = setTimeout(() => {
        onEnd?.()
      }, delay * 1000 + duration * 1000)

      return () => {
        clearTimeout(timeoutId)
        clearTimeout(durationTimeoutId)
      }
    }
  }, [isInView, startWhen, motionValue, direction, from, to, delay, onStart, onEnd, duration])

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest: number) => {
      if (ref.current) {
        ref.current.textContent = formatValue(latest)
      }
    })
    return () => unsubscribe()
  }, [springValue, formatValue])

  return <span className={className} ref={ref} />
}

// Shiny text effect (based on ReactBits ShinyText)
interface ShinyTextProps {
  text: string
  disabled?: boolean
  speed?: number
  className?: string
}

export function ShinyText({ text, disabled = false, speed = 5, className = '' }: ShinyTextProps) {
  return (
    <span
      className={`inline-block bg-clip-text ${disabled ? '' : 'animate-shine'} ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(120deg, rgba(255, 255, 255, 0) 40%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 0) 60%)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        animationDuration: `${speed}s`,
      }}
    >
      {text}
    </span>
  )
}

// Gradient animated text
interface GradientTextProps {
  text: string
  from?: string
  via?: string
  to?: string
  className?: string
}

export function GradientText({
  text,
  from = 'from-purple-500',
  via = 'via-pink-500',
  to = 'to-orange-500',
  className = '',
}: GradientTextProps) {
  return (
    <span
      className={`bg-gradient-to-r ${from} ${via} ${to} bg-clip-text text-transparent animate-gradient ${className}`}
    >
      {text}
    </span>
  )
}

// Success celebration animation
export const Celebration = forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
  ({ children, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
)
Celebration.displayName = 'Celebration'

// Level up animation
export const LevelUp = forwardRef<HTMLDivElement, HTMLMotionProps<'div'>>(
  ({ children, ...props }, ref) => (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.3 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
)
LevelUp.displayName = 'LevelUp'

// Re-export motion for custom usage
export { motion, AnimatePresence } from 'framer-motion'
