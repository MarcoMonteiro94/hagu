'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageTransition, CountUp } from '@/components/ui/motion'
import { PomodoroTimer, PomodoroSettings } from '@/components/pomodoro'
import { usePomodoroStore, useTodaySessions } from '@/stores/pomodoro'
import { Timer, Target, Clock, Coffee } from 'lucide-react'

export default function PomodoroPage() {
  const t = useTranslations('studies')
  const [mounted, setMounted] = useState(false)

  const { totalFocusMinutes, settings } = usePomodoroStore()
  const todaySessions = useTodaySessions()

  useEffect(() => {
    setMounted(true)
  }, [])

  const todayFocusMinutes = todaySessions.reduce(
    (acc, session) => acc + session.focusMinutes,
    0
  )

  const totalHours = Math.floor(totalFocusMinutes / 60)

  return (
    <PageTransition className="container mx-auto max-w-md space-y-6 p-4 lg:max-w-4xl lg:p-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('pomodoro')}</h1>
          <p className="text-muted-foreground">{t('focusTime')}</p>
        </div>
        <PomodoroSettings />
      </header>

      {/* Timer */}
      <Card>
        <CardContent className="flex justify-center py-8">
          <PomodoroTimer />
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Timer className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CountUp
                  to={mounted ? todaySessions.length : 0}
                  duration={1}
                  className="text-2xl font-bold"
                />
                <p className="text-xs text-muted-foreground">Sessões hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/10 p-2">
                <Clock className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <CountUp
                  to={mounted ? todayFocusMinutes : 0}
                  duration={1}
                  className="text-2xl font-bold"
                />
                <p className="text-xs text-muted-foreground">Minutos hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Target className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <CountUp
                  to={mounted ? totalHours : 0}
                  duration={1}
                  className="text-2xl font-bold"
                />
                <p className="text-xs text-muted-foreground">Horas totais</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-500/10 p-2">
                <Coffee className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <span className="text-2xl font-bold">
                  {settings.focusDuration}/{settings.shortBreakDuration}
                </span>
                <p className="text-xs text-muted-foreground">Foco/Pausa</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <h3 className="mb-2 font-medium">Como funciona o Pomodoro?</h3>
          <ol className="list-inside list-decimal space-y-1 text-sm text-muted-foreground">
            <li>Foque por {settings.focusDuration} minutos sem interrupções</li>
            <li>Faça uma pausa curta de {settings.shortBreakDuration} minutos</li>
            <li>Após {settings.sessionsBeforeLongBreak} sessões, faça uma pausa longa de {settings.longBreakDuration} minutos</li>
            <li>Repita e mantenha o foco!</li>
          </ol>
        </CardContent>
      </Card>
    </PageTransition>
  )
}
