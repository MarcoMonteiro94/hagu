'use client'

import { toast } from 'sonner'
import { getAchievementDefinition, RARITY_COLORS } from '@/config/achievements'
import { Trophy } from 'lucide-react'

interface AchievementToastProps {
  type: string
  title: string
  description: string
  xp: number
}

export function showAchievementToast({ type, title, description, xp }: AchievementToastProps) {
  const definition = getAchievementDefinition(type)
  const rarityColor = definition ? RARITY_COLORS[definition.rarity] : '#f59e0b'
  const IconComponent = definition?.icon || Trophy

  toast.custom(
    (t) => (
      <div
        className="flex items-center gap-4 rounded-lg border bg-background p-4 shadow-lg animate-in slide-in-from-top-5 duration-300"
        style={{ borderColor: rarityColor }}
      >
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${definition?.color || '#f59e0b'}20`, color: definition?.color || '#f59e0b' }}
        >
          <IconComponent className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-yellow-500">🏆 Conquista Desbloqueada!</span>
          </div>
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="text-right">
          <span className="text-lg font-bold text-primary">+{xp}</span>
          <p className="text-xs text-muted-foreground">XP</p>
        </div>
      </div>
    ),
    {
      duration: 5000,
      position: 'top-center',
    }
  )
}
