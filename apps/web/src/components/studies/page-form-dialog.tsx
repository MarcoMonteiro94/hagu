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
import { useCreatePage, useUpdatePage } from '@/hooks/queries/use-notebooks'
import type { NotebookPageSummary } from '@/types'
import { toast } from 'sonner'

interface PageFormDialogProps {
  trigger: React.ReactNode
  notebookId: string
  page?: NotebookPageSummary
  onSuccess?: (pageId: string) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function PageFormDialog({
  trigger,
  notebookId,
  page,
  onSuccess,
  open: controlledOpen,
  onOpenChange,
}: PageFormDialogProps) {
  const t = useTranslations('studies')
  const [internalOpen, setInternalOpen] = useState(false)
  const [title, setTitle] = useState('')

  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  const createMutation = useCreatePage()
  const updateMutation = useUpdatePage()

  const isEditing = !!page

  useEffect(() => {
    if (page) {
      setTitle(page.title)
    } else {
      setTitle('')
    }
  }, [page, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error(t('titleRequired'))
      return
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: page.id,
          notebookId,
          data: { title: title.trim() },
        })
        toast.success(t('pageRenamed'))
        setOpen(false)
        onSuccess?.(page.id)
      } else {
        const newPage = await createMutation.mutateAsync({
          notebookId,
          title: title.trim(),
        })
        toast.success(t('pageCreated'))
        setOpen(false)
        onSuccess?.(newPage.id)
      }
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
            {isEditing ? t('renamePage') : t('newPage')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('pageTitle')}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('pageTitlePlaceholder')}
              autoFocus
            />
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
                ? t('rename')
                : t('createPage')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
