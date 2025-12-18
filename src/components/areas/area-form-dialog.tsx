'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAreasStore } from '@/stores/areas'
import {
  Heart,
  BookOpen,
  Wallet,
  Palette,
  Briefcase,
  Home,
  Users,
  Dumbbell,
  Music,
  Camera,
  Plane,
  Coffee,
  Gamepad2,
  Sparkles,
  Brain,
  Target,
  Plus,
} from 'lucide-react'
import type { LifeArea } from '@/types'

interface AreaFormDialogProps {
  area?: LifeArea
  children?: ReactNode
}

const AREA_COLORS = [
  '#22c55e', // green
  '#3b82f6', // blue
  '#eab308', // yellow
  '#a855f7', // purple
  '#ef4444', // red
  '#f97316', // orange
  '#ec4899', // pink
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#84cc16', // lime
  '#8b5cf6', // violet
  '#06b6d4', // cyan
]

const AREA_ICONS = [
  { name: 'heart', icon: Heart },
  { name: 'book', icon: BookOpen },
  { name: 'wallet', icon: Wallet },
  { name: 'palette', icon: Palette },
  { name: 'briefcase', icon: Briefcase },
  { name: 'home', icon: Home },
  { name: 'users', icon: Users },
  { name: 'dumbbell', icon: Dumbbell },
  { name: 'music', icon: Music },
  { name: 'camera', icon: Camera },
  { name: 'plane', icon: Plane },
  { name: 'coffee', icon: Coffee },
  { name: 'gamepad', icon: Gamepad2 },
  { name: 'sparkles', icon: Sparkles },
  { name: 'brain', icon: Brain },
  { name: 'target', icon: Target },
]

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function AreaFormDialog({ area, children }: AreaFormDialogProps) {
  const t = useTranslations('areas')
  const tCommon = useTranslations('common')
  const { addArea, updateArea } = useAreasStore()

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(AREA_COLORS[0])
  const [icon, setIcon] = useState('heart')

  const isEditing = !!area

  useEffect(() => {
    if (open && area) {
      setName(area.name)
      setColor(area.color)
      setIcon(area.icon)
    } else if (open && !area) {
      setName('')
      setColor(AREA_COLORS[Math.floor(Math.random() * AREA_COLORS.length)])
      setIcon('heart')
    }
  }, [open, area])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) return

    if (isEditing && area) {
      updateArea(area.id, {
        name: name.trim(),
        slug: generateSlug(name.trim()),
        color,
        icon,
      })
    } else {
      addArea({
        name: name.trim(),
        slug: generateSlug(name.trim()),
        color,
        icon,
      })
    }

    setOpen(false)
  }

  const SelectedIcon = AREA_ICONS.find((i) => i.name === icon)?.icon || Heart

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            {t('addNew')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('editArea') : t('addNew')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Preview */}
          <div className="flex items-center justify-center">
            <div
              className="flex h-20 w-20 items-center justify-center rounded-2xl transition-colors"
              style={{ backgroundColor: `${color}20`, color }}
            >
              <SelectedIcon className="h-10 w-10" />
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">{t('areaName')}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Carreira, Família, Esportes..."
              autoFocus
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="grid grid-cols-6 gap-2">
              {AREA_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full transition-transform hover:scale-110 ${
                    color === c ? 'ring-2 ring-offset-2 ring-offset-background' : ''
                  }`}
                  style={{
                    backgroundColor: c,
                    '--tw-ring-color': c
                  } as React.CSSProperties}
                />
              ))}
            </div>
          </div>

          {/* Icon Picker */}
          <div className="space-y-2">
            <Label>Ícone</Label>
            <div className="grid grid-cols-8 gap-2">
              {AREA_ICONS.map(({ name: iconName, icon: IconComponent }) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setIcon(iconName)}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                    icon === iconName
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <IconComponent className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" className="flex-1" disabled={!name.trim()}>
              {isEditing ? tCommon('save') : tCommon('create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
