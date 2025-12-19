'use client'

import { useEffect, useRef } from 'react'
import { useSettingsStore } from '@/stores/settings'
import { useActiveHabits } from '@/hooks/queries/use-habits'
import { useTodayTasks } from '@/hooks/queries/use-tasks'
import {
  sendDailySummary,
  getNotificationPermission,
} from '@/lib/notifications'

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const notificationsEnabled = useSettingsStore((state) => state.notificationsEnabled)
  const { data: habits = [] } = useActiveHabits()
  const tasks = useTodayTasks()
  const lastNotificationDate = useRef<string | null>(null)

  useEffect(() => {
    if (!notificationsEnabled) return
    if (getNotificationPermission() !== 'granted') return

    const today = getTodayString()
    const dayOfWeek = new Date().getDay()

    // Only send daily summary once per day
    if (lastNotificationDate.current === today) return
    lastNotificationDate.current = today

    // Calculate pending habits for today
    const todayHabits = habits.filter((habit) => {
      if (habit.frequency.type === 'daily') return true
      if (habit.frequency.type === 'specificDays') {
        return habit.frequency.days.includes(dayOfWeek)
      }
      return true
    })

    const pendingHabits = todayHabits.filter(
      (habit) => !habit.completions.some((c) => c.date === today)
    )

    // Count pending tasks for today
    const pendingTasks = tasks.filter((task) => task.status !== 'done')

    // Send daily summary if there are pending items
    if (pendingHabits.length > 0 || pendingTasks.length > 0) {
      // Small delay to ensure the app is fully loaded
      setTimeout(() => {
        sendDailySummary(pendingHabits.length, pendingTasks.length)
      }, 2000)
    }
  }, [notificationsEnabled, habits, tasks])

  return <>{children}</>
}
