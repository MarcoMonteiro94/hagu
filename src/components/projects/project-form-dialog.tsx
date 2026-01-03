'use client'

import { useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { useCreateProject, useUpdateProject } from '@/hooks/queries/use-projects'
import type { Project, CreateProjectData, UpdateProjectData } from '@/types'
import { PROJECT_COLORS, PROJECT_ICONS } from '@/types'
import { Plus, Check, Edit, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import {
  Rocket,
  Target,
  Lightbulb,
  Code,
  Briefcase,
  GraduationCap,
  Heart,
  Star,
  Flag,
  Trophy,
  Compass,
  Zap,
} from 'lucide-react'

const ICON_MAP: Record<string, React.ElementType> = {
  rocket: Rocket,
  target: Target,
  lightbulb: Lightbulb,
  code: Code,
  briefcase: Briefcase,
  'graduation-cap': GraduationCap,
  heart: Heart,
  star: Star,
  flag: Flag,
  trophy: Trophy,
  compass: Compass,
  zap: Zap,
}

interface ProjectFormDialogProps {
  children?: React.ReactNode
  project?: Project
  onClose?: () => void
}

export function ProjectFormDialog({ children, project, onClose }: ProjectFormDialogProps) {
  const t = useTranslations('projects')
  const tCommon = useTranslations('common')

  const createProjectMutation = useCreateProject()
  const updateProjectMutation = useUpdateProject()

  const isEditing = !!project

  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(project?.title || '')
  const [description, setDescription] = useState(project?.description || '')
  const [color, setColor] = useState(project?.color || PROJECT_COLORS[5])
  const [icon, setIcon] = useState(project?.icon || 'rocket')
  const [dueDate, setDueDate] = useState(project?.dueDate || '')
  const [startDate, setStartDate] = useState(
    project?.startDate || new Date().toISOString().split('T')[0]
  )

  const resetForm = () => {
    if (project) {
      setTitle(project.title)
      setDescription(project.description || '')
      setColor(project.color || PROJECT_COLORS[5])
      setIcon(project.icon || 'rocket')
      setDueDate(project.dueDate || '')
      setStartDate(project.startDate || new Date().toISOString().split('T')[0])
    } else {
      setTitle('')
      setDescription('')
      setColor(PROJECT_COLORS[5])
      setIcon('rocket')
      setDueDate('')
      setStartDate(new Date().toISOString().split('T')[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return

    try {
      if (isEditing && project) {
        const updates: UpdateProjectData = {
          title: title.trim(),
          description: description.trim() || undefined,
          color,
          icon,
          dueDate: dueDate || undefined,
          startDate: startDate || undefined,
        }
        await updateProjectMutation.mutateAsync({
          id: project.id,
          updates,
        })
        toast.success(t('projectUpdated'))
      } else {
        const data: CreateProjectData = {
          title: title.trim(),
          description: description.trim() || undefined,
          color,
          icon,
          dueDate: dueDate || undefined,
          startDate: startDate || undefined,
        }
        await createProjectMutation.mutateAsync(data)
        toast.success(t('projectCreated'))
      }

      resetForm()
      setOpen(false)
      onClose?.()
    } catch (error) {
      const err = error as Error
      console.error('Failed to save project:', err.message || err)
      toast.error(isEditing ? t('projectUpdateError') : t('projectCreateError'))
    }
  }

  const isSubmitting = createProjectMutation.isPending || updateProjectMutation.isPending

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      onClose?.()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children ||
          (isEditing ? (
            <Button variant="outline" size="sm">
              <Edit className="mr-1 h-4 w-4" />
              {tCommon('edit')}
            </Button>
          ) : (
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              {t('addNew')}
            </Button>
          ))}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('editProject') : t('addNew')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t('projectName')}</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('projectNamePlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('projectDescription')}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('projectDescriptionPlaceholder')}
                rows={3}
              />
            </div>
          </div>

          {/* Icon Selection */}
          <div className="space-y-2">
            <Label>{t('icon')}</Label>
            <div className="grid grid-cols-6 gap-2" role="radiogroup" aria-label={t('icon')}>
              {PROJECT_ICONS.map((iconName) => {
                const IconComponent = ICON_MAP[iconName]
                return (
                  <button
                    key={iconName}
                    type="button"
                    role="radio"
                    aria-checked={icon === iconName}
                    aria-label={iconName}
                    className={`flex h-9 w-full items-center justify-center rounded-lg border-2 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                      icon === iconName
                        ? 'border-primary bg-primary/10'
                        : 'border-muted hover:border-muted-foreground/50'
                    }`}
                    onClick={() => setIcon(iconName)}
                  >
                    {IconComponent && <IconComponent className="h-4 w-4" style={{ color }} />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label>{t('color')}</Label>
            <div className="grid grid-cols-10 gap-1.5 sm:gap-2" role="radiogroup" aria-label={t('color')}>
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={color === c}
                  className="flex aspect-square w-full items-center justify-center rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                >
                  {color === c && <Check className="h-3 w-3 sm:h-4 sm:w-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {t('startDate')}
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {t('dueDate')}
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t('dueDateOptional')}</p>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? tCommon('saving') : isEditing ? tCommon('save') : tCommon('create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
