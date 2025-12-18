'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'
import { forwardRef } from 'react'

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

// Number counter animation
interface CountUpProps {
  from?: number
  to: number
  duration?: number
  className?: string
}

export function CountUp({ from = 0, to, duration = 1, className }: CountUpProps) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {to}
      </motion.span>
    </motion.span>
  )
}

// Re-export motion for custom usage
export { motion, AnimatePresence } from 'framer-motion'
