import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { AppState, AppStateStatus, Platform, Vibration } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Note: expo-notifications would be imported here when the package is installed
// import * as Notifications from 'expo-notifications'

// =============================================================================
// Types
// =============================================================================

export type TimerMode = 'work' | 'shortBreak' | 'longBreak'
export type TimerState = 'idle' | 'running' | 'paused'

export interface PomodoroSettings {
  workDuration: number // in minutes
  shortBreakDuration: number // in minutes
  longBreakDuration: number // in minutes
  sessionsBeforeLongBreak: number
  autoStartBreaks: boolean
  autoStartWork: boolean
  soundEnabled: boolean
  vibrationEnabled: boolean
}

export interface PomodoroSession {
  id: string
  taskId?: string
  taskTitle?: string
  mode: TimerMode
  duration: number // in minutes
  completedAt: string
  date: string // YYYY-MM-DD
}

export interface PomodoroStats {
  today: {
    workSessions: number
    totalMinutes: number
  }
  week: {
    workSessions: number
    totalMinutes: number
  }
  streak: number
  totalSessions: number
}

interface TimerSnapshot {
  mode: TimerMode
  timeRemaining: number
  totalTime: number
  backgroundedAt: number | null
  state: TimerState
  sessionsCompleted: number
}

// =============================================================================
// Constants
// =============================================================================

const STORAGE_KEYS = {
  settings: 'pomodoro-settings',
  sessions: 'pomodoro-sessions',
  timerSnapshot: 'pomodoro-timer-snapshot',
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartWork: false,
  soundEnabled: true,
  vibrationEnabled: true,
}

const QUERY_KEYS = {
  settings: ['pomodoro', 'settings'],
  sessions: ['pomodoro', 'sessions'],
  stats: ['pomodoro', 'stats'],
}

// =============================================================================
// Storage Helpers
// =============================================================================

async function loadSettings(): Promise<PomodoroSettings> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.settings)
    if (data) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) }
    }
  } catch (error) {
    console.error('Failed to load pomodoro settings:', error)
  }
  return DEFAULT_SETTINGS
}

async function saveSettings(settings: PomodoroSettings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings))
}

async function loadSessions(): Promise<PomodoroSession[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.sessions)
    if (data) {
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Failed to load pomodoro sessions:', error)
  }
  return []
}

async function saveSessions(sessions: PomodoroSession[]): Promise<void> {
  // Keep only last 30 days of sessions
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

  const filteredSessions = sessions.filter(s => s.date >= thirtyDaysAgoStr)
  await AsyncStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(filteredSessions))
}

async function saveTimerSnapshot(snapshot: TimerSnapshot | null): Promise<void> {
  if (snapshot) {
    await AsyncStorage.setItem(STORAGE_KEYS.timerSnapshot, JSON.stringify(snapshot))
  } else {
    await AsyncStorage.removeItem(STORAGE_KEYS.timerSnapshot)
  }
}

async function loadTimerSnapshot(): Promise<TimerSnapshot | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.timerSnapshot)
    if (data) {
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Failed to load timer snapshot:', error)
  }
  return null
}

// =============================================================================
// Notifications
// =============================================================================

// TODO: Implement actual notifications when expo-notifications is installed
// For now, these are stubs that return without doing anything
async function scheduleTimerNotification(mode: TimerMode, seconds: number): Promise<string | null> {
  if (Platform.OS === 'web') return null

  // TODO: Uncomment and implement when expo-notifications is installed
  // try {
  //   const { status } = await Notifications.getPermissionsAsync()
  //   if (status !== 'granted') {
  //     const { status: newStatus } = await Notifications.requestPermissionsAsync()
  //     if (newStatus !== 'granted') return null
  //   }
  //
  //   const title = mode === 'work'
  //     ? 'Focus session complete!'
  //     : 'Break is over!'
  //   const body = mode === 'work'
  //     ? 'Time for a break. Great work!'
  //     : 'Ready to focus again?'
  //
  //   const id = await Notifications.scheduleNotificationAsync({
  //     content: { title, body, sound: true },
  //     trigger: { seconds, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
  //   })
  //
  //   return id
  // } catch (error) {
  //   console.error('Failed to schedule notification:', error)
  //   return null
  // }

  // For now, return a mock ID
  return `mock-notification-${Date.now()}`
}

async function cancelTimerNotification(notificationId: string | null): Promise<void> {
  if (notificationId && Platform.OS !== 'web') {
    // TODO: Implement when expo-notifications is installed
    // try {
    //   await Notifications.cancelScheduledNotificationAsync(notificationId)
    // } catch (error) {
    //   console.error('Failed to cancel notification:', error)
    // }
  }
}

// =============================================================================
// Hooks
// =============================================================================

export function usePomodoroSettings() {
  const queryClient = useQueryClient()

  const { data: settings = DEFAULT_SETTINGS, isLoading } = useQuery({
    queryKey: QUERY_KEYS.settings,
    queryFn: loadSettings,
    staleTime: Infinity,
  })

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<PomodoroSettings>) => {
      const newSettings = { ...settings, ...updates }
      await saveSettings(newSettings)
      return newSettings
    },
    onSuccess: (newSettings) => {
      queryClient.setQueryData(QUERY_KEYS.settings, newSettings)
    },
  })

  return {
    settings,
    isLoading,
    updateSettings: updateMutation.mutate,
  }
}

export function usePomodoroSessions() {
  const queryClient = useQueryClient()

  const { data: sessions = [], isLoading, refetch } = useQuery({
    queryKey: QUERY_KEYS.sessions,
    queryFn: loadSessions,
    staleTime: 1000 * 60, // 1 minute
  })

  const addSessionMutation = useMutation({
    mutationFn: async (session: Omit<PomodoroSession, 'id' | 'completedAt' | 'date'>) => {
      const now = new Date()
      const newSession: PomodoroSession = {
        ...session,
        id: crypto.randomUUID(),
        completedAt: now.toISOString(),
        date: now.toISOString().split('T')[0],
      }
      const updatedSessions = [...sessions, newSession]
      await saveSessions(updatedSessions)
      return { sessions: updatedSessions, newSession }
    },
    onSuccess: ({ sessions: updatedSessions }) => {
      queryClient.setQueryData(QUERY_KEYS.sessions, updatedSessions)
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stats })
    },
  })

  return {
    sessions,
    isLoading,
    refetch,
    addSession: addSessionMutation.mutateAsync,
  }
}

export function usePomodoroStats() {
  const { sessions } = usePomodoroSessions()

  return useMemo<PomodoroStats>(() => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    // Calculate week start (Monday)
    const weekStart = new Date(now)
    const dayOfWeek = weekStart.getDay()
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    weekStart.setDate(weekStart.getDate() - diff)
    const weekStartStr = weekStart.toISOString().split('T')[0]

    const todaySessions = sessions.filter(s => s.date === today && s.mode === 'work')
    const weekSessions = sessions.filter(s => s.date >= weekStartStr && s.mode === 'work')
    const workSessions = sessions.filter(s => s.mode === 'work')

    // Calculate streak (consecutive days with at least one work session)
    const uniqueDays = [...new Set(workSessions.map(s => s.date))].sort().reverse()
    let streak = 0
    let checkDate = new Date(now)

    for (const day of uniqueDays) {
      const expectedDate = checkDate.toISOString().split('T')[0]
      if (day === expectedDate) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else if (day < expectedDate) {
        break
      }
    }

    return {
      today: {
        workSessions: todaySessions.length,
        totalMinutes: todaySessions.reduce((sum, s) => sum + s.duration, 0),
      },
      week: {
        workSessions: weekSessions.length,
        totalMinutes: weekSessions.reduce((sum, s) => sum + s.duration, 0),
      },
      streak,
      totalSessions: workSessions.length,
    }
  }, [sessions])
}

export function usePomodoroTimer() {
  const { settings } = usePomodoroSettings()
  const { addSession } = usePomodoroSessions()
  const queryClient = useQueryClient()

  // Timer state
  const [mode, setMode] = useState<TimerMode>('work')
  const [state, setState] = useState<TimerState>('idle')
  const [timeRemaining, setTimeRemaining] = useState(settings.workDuration * 60)
  const [sessionsCompleted, setSessionsCompleted] = useState(0)

  // Task linking
  const [linkedTask, setLinkedTask] = useState<{ id: string; title: string } | null>(null)

  // Refs
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const notificationIdRef = useRef<string | null>(null)
  const appStateRef = useRef<AppStateStatus>(AppState.currentState)

  // Calculate total time for current mode
  const totalTime = useMemo(() => {
    switch (mode) {
      case 'work':
        return settings.workDuration * 60
      case 'shortBreak':
        return settings.shortBreakDuration * 60
      case 'longBreak':
        return settings.longBreakDuration * 60
    }
  }, [mode, settings])

  // Progress (0 to 1)
  const progress = useMemo(() => {
    return 1 - (timeRemaining / totalTime)
  }, [timeRemaining, totalTime])

  // Format time as MM:SS
  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timeRemaining / 60)
    const seconds = timeRemaining % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }, [timeRemaining])

  // Reset timer to mode duration
  const resetToMode = useCallback((newMode: TimerMode) => {
    switch (newMode) {
      case 'work':
        setTimeRemaining(settings.workDuration * 60)
        break
      case 'shortBreak':
        setTimeRemaining(settings.shortBreakDuration * 60)
        break
      case 'longBreak':
        setTimeRemaining(settings.longBreakDuration * 60)
        break
    }
  }, [settings])

  // Handle timer completion
  const handleTimerComplete = useCallback(async () => {
    // Vibration feedback
    if (settings.vibrationEnabled && Platform.OS !== 'web') {
      Vibration.vibrate([0, 200, 100, 200])
    }

    // Record session
    if (mode === 'work') {
      await addSession({
        mode: 'work',
        duration: settings.workDuration,
        taskId: linkedTask?.id,
        taskTitle: linkedTask?.title,
      })

      const newSessionsCompleted = sessionsCompleted + 1
      setSessionsCompleted(newSessionsCompleted)

      // Determine next break type
      const nextMode = newSessionsCompleted % settings.sessionsBeforeLongBreak === 0
        ? 'longBreak'
        : 'shortBreak'

      setMode(nextMode)
      resetToMode(nextMode)

      if (settings.autoStartBreaks) {
        // Will auto-start in next tick
        setTimeout(() => setState('running'), 100)
      } else {
        setState('idle')
      }
    } else {
      // Break completed
      await addSession({
        mode,
        duration: mode === 'shortBreak' ? settings.shortBreakDuration : settings.longBreakDuration,
      })

      setMode('work')
      resetToMode('work')

      if (settings.autoStartWork) {
        setTimeout(() => setState('running'), 100)
      } else {
        setState('idle')
      }
    }

    // Clear notification ref
    notificationIdRef.current = null

    // Clear snapshot
    await saveTimerSnapshot(null)
  }, [mode, settings, sessionsCompleted, linkedTask, addSession, resetToMode])

  // Start timer
  const start = useCallback(async () => {
    setState('running')

    // Schedule notification for background
    notificationIdRef.current = await scheduleTimerNotification(mode, timeRemaining)
  }, [mode, timeRemaining])

  // Pause timer
  const pause = useCallback(async () => {
    setState('paused')

    // Cancel scheduled notification
    await cancelTimerNotification(notificationIdRef.current)
    notificationIdRef.current = null
  }, [])

  // Reset timer
  const reset = useCallback(async () => {
    setState('idle')
    resetToMode(mode)

    await cancelTimerNotification(notificationIdRef.current)
    notificationIdRef.current = null
    await saveTimerSnapshot(null)
  }, [mode, resetToMode])

  // Skip to next phase
  const skip = useCallback(async () => {
    await cancelTimerNotification(notificationIdRef.current)
    notificationIdRef.current = null

    if (mode === 'work') {
      const nextMode = (sessionsCompleted + 1) % settings.sessionsBeforeLongBreak === 0
        ? 'longBreak'
        : 'shortBreak'
      setMode(nextMode)
      resetToMode(nextMode)
    } else {
      setMode('work')
      resetToMode('work')
    }
    setState('idle')
    await saveTimerSnapshot(null)
  }, [mode, sessionsCompleted, settings.sessionsBeforeLongBreak, resetToMode])

  // Change mode manually
  const changeMode = useCallback(async (newMode: TimerMode) => {
    await cancelTimerNotification(notificationIdRef.current)
    notificationIdRef.current = null

    setMode(newMode)
    resetToMode(newMode)
    setState('idle')
    await saveTimerSnapshot(null)
  }, [resetToMode])

  // Link/unlink task
  const linkTask = useCallback((task: { id: string; title: string } | null) => {
    setLinkedTask(task)
  }, [])

  // Timer interval effect
  useEffect(() => {
    if (state === 'running') {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!)
            intervalRef.current = null
            handleTimerComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [state, handleTimerComplete])

  // App state handling for background timer
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
        // Going to background - save snapshot
        if (state === 'running') {
          await saveTimerSnapshot({
            mode,
            timeRemaining,
            totalTime,
            backgroundedAt: Date.now(),
            state,
            sessionsCompleted,
          })
        }
      } else if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // Coming back to foreground - restore and adjust time
        const snapshot = await loadTimerSnapshot()
        if (snapshot && snapshot.state === 'running' && snapshot.backgroundedAt) {
          const elapsedSeconds = Math.floor((Date.now() - snapshot.backgroundedAt) / 1000)
          const newTimeRemaining = Math.max(0, snapshot.timeRemaining - elapsedSeconds)

          if (newTimeRemaining <= 0) {
            // Timer should have completed
            await handleTimerComplete()
          } else {
            setTimeRemaining(newTimeRemaining)
          }

          await saveTimerSnapshot(null)
        }
      }
      appStateRef.current = nextAppState
    })

    return () => subscription.remove()
  }, [state, mode, timeRemaining, totalTime, sessionsCompleted, handleTimerComplete])

  // Sync with settings changes
  useEffect(() => {
    if (state === 'idle') {
      resetToMode(mode)
    }
  }, [settings, state, mode, resetToMode])

  return {
    // State
    mode,
    state,
    timeRemaining,
    totalTime,
    progress,
    formattedTime,
    sessionsCompleted,
    linkedTask,

    // Actions
    start,
    pause,
    reset,
    skip,
    changeMode,
    linkTask,
  }
}
