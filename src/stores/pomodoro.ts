import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import { createClient } from '@/lib/supabase/client'
import { userStatsService } from '@/services/gamification.service'

export type PomodoroPhase = 'focus' | 'shortBreak' | 'longBreak'
export type TimerStatus = 'idle' | 'running' | 'paused'

interface PomodoroSettings {
  focusDuration: number // minutes
  shortBreakDuration: number // minutes
  longBreakDuration: number // minutes
  sessionsBeforeLongBreak: number
  autoStartBreaks: boolean
  autoStartFocus: boolean
}

interface PomodoroSession {
  id: string
  date: string
  focusMinutes: number
  completedAt: string
}

interface PomodoroState {
  // Timer state
  status: TimerStatus
  phase: PomodoroPhase
  timeRemaining: number // seconds
  sessionsCompleted: number

  // Settings
  settings: PomodoroSettings

  // History
  sessions: PomodoroSession[]
  totalFocusMinutes: number

  // Actions
  startTimer: () => void
  pauseTimer: () => void
  resetTimer: () => void
  tick: () => void
  skipPhase: () => void
  completeSession: () => void
  updateSettings: (settings: Partial<PomodoroSettings>) => void
}

const DEFAULT_SETTINGS: PomodoroSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
}

function generateId(): string {
  return crypto.randomUUID()
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

function getPhaseTime(phase: PomodoroPhase, settings: PomodoroSettings): number {
  switch (phase) {
    case 'focus':
      return settings.focusDuration * 60
    case 'shortBreak':
      return settings.shortBreakDuration * 60
    case 'longBreak':
      return settings.longBreakDuration * 60
  }
}

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set, get) => ({
      status: 'idle',
      phase: 'focus',
      timeRemaining: DEFAULT_SETTINGS.focusDuration * 60,
      sessionsCompleted: 0,
      settings: DEFAULT_SETTINGS,
      sessions: [],
      totalFocusMinutes: 0,

      startTimer: () => {
        set({ status: 'running' })
      },

      pauseTimer: () => {
        set({ status: 'paused' })
      },

      resetTimer: () => {
        const { phase, settings } = get()
        set({
          status: 'idle',
          timeRemaining: getPhaseTime(phase, settings),
        })
      },

      tick: () => {
        const { timeRemaining, status } = get()
        if (status !== 'running') return

        if (timeRemaining <= 1) {
          get().completeSession()
        } else {
          set({ timeRemaining: timeRemaining - 1 })
        }
      },

      skipPhase: () => {
        const { phase, sessionsCompleted, settings } = get()

        let nextPhase: PomodoroPhase
        let nextSessions = sessionsCompleted

        if (phase === 'focus') {
          nextSessions = sessionsCompleted + 1
          if (nextSessions >= settings.sessionsBeforeLongBreak) {
            nextPhase = 'longBreak'
          } else {
            nextPhase = 'shortBreak'
          }
        } else {
          nextPhase = 'focus'
          if (phase === 'longBreak') {
            nextSessions = 0
          }
        }

        set({
          phase: nextPhase,
          sessionsCompleted: nextSessions,
          timeRemaining: getPhaseTime(nextPhase, settings),
          status: 'idle',
        })
      },

      completeSession: () => {
        const { phase, sessionsCompleted, settings } = get()

        // If completing a focus session, record it and award XP
        if (phase === 'focus') {
          const session: PomodoroSession = {
            id: generateId(),
            date: getTodayString(),
            focusMinutes: settings.focusDuration,
            completedAt: new Date().toISOString(),
          }

          set((state) => ({
            sessions: [...state.sessions, session],
            totalFocusMinutes: state.totalFocusMinutes + settings.focusDuration,
          }))

          // Award XP for completing a focus session (20 XP)
          if (typeof window !== 'undefined') {
            try {
              const supabase = createClient()
              userStatsService.addXp(supabase, 20)
            } catch (error) {
              console.error('Failed to award XP:', error)
            }
          }
        }

        // Determine next phase
        let nextPhase: PomodoroPhase
        let nextSessions = sessionsCompleted

        if (phase === 'focus') {
          nextSessions = sessionsCompleted + 1
          if (nextSessions >= settings.sessionsBeforeLongBreak) {
            nextPhase = 'longBreak'
          } else {
            nextPhase = 'shortBreak'
          }
        } else {
          nextPhase = 'focus'
          if (phase === 'longBreak') {
            nextSessions = 0
          }
        }

        const shouldAutoStart =
          (nextPhase !== 'focus' && settings.autoStartBreaks) ||
          (nextPhase === 'focus' && settings.autoStartFocus)

        set({
          phase: nextPhase,
          sessionsCompleted: nextSessions,
          timeRemaining: getPhaseTime(nextPhase, settings),
          status: shouldAutoStart ? 'running' : 'idle',
        })
      },

      updateSettings: (newSettings) => {
        set((state) => {
          const settings = { ...state.settings, ...newSettings }
          return {
            settings,
            // Reset timer if idle
            timeRemaining:
              state.status === 'idle'
                ? getPhaseTime(state.phase, settings)
                : state.timeRemaining,
          }
        })
      },
    }),
    {
      name: 'hagu-pomodoro',
      partialize: (state) => ({
        settings: state.settings,
        sessions: state.sessions,
        totalFocusMinutes: state.totalFocusMinutes,
      }),
    }
  )
)

// Selector hooks
export function useTodaySessions(): PomodoroSession[] {
  const today = getTodayString()
  return usePomodoroStore(
    useShallow((state) => state.sessions.filter((s) => s.date === today))
  )
}
