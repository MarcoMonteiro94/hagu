'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { usePomodoroStore } from '@/stores/pomodoro'
import { Settings } from 'lucide-react'

const DURATION_OPTIONS = [15, 20, 25, 30, 45, 60]
const BREAK_OPTIONS = [3, 5, 10, 15, 20]
const LONG_BREAK_OPTIONS = [10, 15, 20, 25, 30]

export function PomodoroSettings() {
  const t = useTranslations('studies')
  const { settings, updateSettings } = usePomodoroStore()

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Configurações do Pomodoro</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Focus Duration */}
          <div className="space-y-2">
            <Label>Tempo de foco (minutos)</Label>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((mins) => (
                <Button
                  key={mins}
                  size="sm"
                  variant={settings.focusDuration === mins ? 'default' : 'outline'}
                  onClick={() => updateSettings({ focusDuration: mins })}
                >
                  {mins}
                </Button>
              ))}
            </div>
          </div>

          {/* Short Break Duration */}
          <div className="space-y-2">
            <Label>Pausa curta (minutos)</Label>
            <div className="flex flex-wrap gap-2">
              {BREAK_OPTIONS.map((mins) => (
                <Button
                  key={mins}
                  size="sm"
                  variant={settings.shortBreakDuration === mins ? 'default' : 'outline'}
                  onClick={() => updateSettings({ shortBreakDuration: mins })}
                >
                  {mins}
                </Button>
              ))}
            </div>
          </div>

          {/* Long Break Duration */}
          <div className="space-y-2">
            <Label>Pausa longa (minutos)</Label>
            <div className="flex flex-wrap gap-2">
              {LONG_BREAK_OPTIONS.map((mins) => (
                <Button
                  key={mins}
                  size="sm"
                  variant={settings.longBreakDuration === mins ? 'default' : 'outline'}
                  onClick={() => updateSettings({ longBreakDuration: mins })}
                >
                  {mins}
                </Button>
              ))}
            </div>
          </div>

          {/* Sessions before long break */}
          <div className="space-y-2">
            <Label>Sessões antes da pausa longa</Label>
            <div className="flex flex-wrap gap-2">
              {[2, 3, 4, 5, 6].map((count) => (
                <Button
                  key={count}
                  size="sm"
                  variant={
                    settings.sessionsBeforeLongBreak === count ? 'default' : 'outline'
                  }
                  onClick={() => updateSettings({ sessionsBeforeLongBreak: count })}
                >
                  {count}
                </Button>
              ))}
            </div>
          </div>

          {/* Auto-start options */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="autoBreaks">Iniciar pausas automaticamente</Label>
              <Switch
                id="autoBreaks"
                checked={settings.autoStartBreaks}
                onCheckedChange={(checked) =>
                  updateSettings({ autoStartBreaks: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="autoFocus">Iniciar foco automaticamente</Label>
              <Switch
                id="autoFocus"
                checked={settings.autoStartFocus}
                onCheckedChange={(checked) =>
                  updateSettings({ autoStartFocus: checked })
                }
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
