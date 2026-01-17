'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateNotebook, useUpdateNotebook } from '@/hooks/queries/use-notebooks'
import { NOTEBOOK_COLORS } from '@/types/studies'
import type { Notebook, NotebookWithPageCount } from '@/types'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NotebookFormDialogProps {
  trigger: React.ReactNode
  notebook?: Notebook | NotebookWithPageCount
  onSuccess?: () => void
}

export function NotebookFormDialog({
  trigger,
  notebook,
  onSuccess,
}: NotebookFormDialogProps) {
  const t = useTranslations('studies')
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState<string>(NOTEBOOK_COLORS[11]) // indigo default

  const createMutation = useCreateNotebook()
  const updateMutation = useUpdateNotebook()

  const isEditing = !!notebook

  useEffect(() => {
    if (notebook) {
      setTitle(notebook.title)
      setDescription(notebook.description || '')
      setColor(notebook.color)
    } else {
      setTitle('')
      setDescription('')
      setColor(NOTEBOOK_COLORS[11])
    }
  }, [notebook, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error(t('titleRequired'))
      return
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: notebook.id,
          data: {
            title: title.trim(),
            description: description.trim() || undefined,
            color,
          },
        })
        toast.success(t('notebookUpdated'))
      } else {
        await createMutation.mutateAsync({
          title: title.trim(),
          description: description.trim() || undefined,
          color,
        })
        toast.success(t('notebookCreated'))
      }

      setOpen(false)
      onSuccess?.()
    } catch {
      toast.error(isEditing ? t('updateError') : t('createError'))
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('editNotebook') : t('newNotebook')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('notebookTitle')}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('notebookTitlePlaceholder')}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('notebookDescription')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('notebookDescriptionPlaceholder')}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('color')}</Label>
            <div className="flex flex-wrap gap-2">
              {NOTEBOOK_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={cn(
                    'h-8 w-8 rounded-full transition-all',
                    color === c
                      ? 'ring-2 ring-offset-2 ring-offset-background'
                      : 'hover:scale-110'
                  )}
                  style={{ backgroundColor: c, '--tw-ring-color': c } as React.CSSProperties}
                  onClick={() => setColor(c)}
                >
                  {color === c && (
                    <Check className="h-4 w-4 text-white mx-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? t('saving')
                : isEditing
                ? t('saveChanges')
                : t('createNotebook')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
