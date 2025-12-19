'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { usePomodoroStore, type PomodoroPhase } from '@/stores/pomodoro'
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react'
import { cn } from '@/lib/utils'

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const PHASE_COLORS: Record<PomodoroPhase, string> = {
  focus: 'text-primary',
  shortBreak: 'text-green-500',
  longBreak: 'text-blue-500',
}

const PHASE_BG_COLORS: Record<PomodoroPhase, string> = {
  focus: 'stroke-primary',
  shortBreak: 'stroke-green-500',
  longBreak: 'stroke-blue-500',
}

export function PomodoroTimer() {
  const t = useTranslations('studies')
  const [mounted, setMounted] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const {
    status,
    phase,
    timeRemaining,
    sessionsCompleted,
    settings,
    startTimer,
    pauseTimer,
    resetTimer,
    tick,
    skipPhase,
  } = usePomodoroStore()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Timer interval
  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = setInterval(() => {
        tick()
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
      }
    }
  }, [status, tick])

  // Calculate progress
  const totalTime =
    phase === 'focus'
      ? settings.focusDuration * 60
      : phase === 'shortBreak'
        ? settings.shortBreakDuration * 60
        : settings.longBreakDuration * 60

  const progress = mounted ? ((totalTime - timeRemaining) / totalTime) * 100 : 0

  // SVG circle calculations
  const size = 280
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  const phaseLabel =
    phase === 'focus'
      ? t('focusTime')
      : phase === 'shortBreak'
        ? t('breakTime')
        : t('breakTime')

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Timer Circle */}
      <div className="relative">
        <svg width={size} height={size} className="rotate-[-90deg]">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/20"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={cn('transition-all duration-1000', PHASE_BG_COLORS[phase])}
          />
        </svg>

        {/* Timer display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-sm font-medium', PHASE_COLORS[phase])}>
            {phaseLabel}
          </span>
          <span className="text-6xl font-bold tabular-nums">
            {mounted ? formatTime(timeRemaining) : '00:00'}
          </span>
          <span className="mt-1 text-sm text-muted-foreground">
            {sessionsCompleted}/{settings.sessionsBeforeLongBreak}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={resetTimer}
          disabled={status === 'idle' && timeRemaining === totalTime}
        >
          <RotateCcw className="h-5 w-5" />
        </Button>

        <Button
          size="lg"
          className="h-14 w-14 rounded-full"
          onClick={status === 'running' ? pauseTimer : startTimer}
        >
          {status === 'running' ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6" />
          )}
        </Button>

        <Button variant="outline" size="icon" onClick={skipPhase}>
          <SkipForward className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
