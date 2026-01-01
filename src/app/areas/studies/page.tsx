'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/motion'
import { NotebookCard, NotebookFormDialog } from '@/components/studies'
import {
  useNotebooksWithPageCount,
  useDeleteNotebook,
} from '@/hooks/queries/use-notebooks'
import type { NotebookWithPageCount } from '@/types'
import { Plus, BookOpen, GraduationCap } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function StudiesPage() {
  const t = useTranslations('studies')
  const [mounted, setMounted] = useState(false)
  const [editingNotebook, setEditingNotebook] = useState<NotebookWithPageCount | null>(
    null
  )

  const { data: notebooks, isLoading } = useNotebooksWithPageCount()
  const deleteMutation = useDeleteNotebook()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      toast.success(t('notebookDeleted'))
    } catch {
      toast.error(t('deleteError'))
    }
  }

  if (!mounted || isLoading) {
    return (
      <div className="container mx-auto max-w-6xl p-4 lg:p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <PageTransition className="container mx-auto max-w-6xl space-y-6 p-4 lg:p-6">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
            <GraduationCap className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            <p className="text-muted-foreground">{t('subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/pomodoro">
            <Button variant="outline">
              <BookOpen className="mr-2 h-4 w-4" />
              {t('pomodoro')}
            </Button>
          </Link>
          <NotebookFormDialog
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('newNotebook')}
              </Button>
            }
          />
        </div>
      </header>

      {/* Notebooks Grid */}
      {notebooks && notebooks.length > 0 ? (
        <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notebooks.map((notebook) => (
            <StaggerItem key={notebook.id}>
              <NotebookCard
                notebook={notebook}
                onEdit={setEditingNotebook}
                onDelete={handleDelete}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{t('noNotebooks')}</h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            {t('noNotebooksDescription')}
          </p>
          <NotebookFormDialog
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('createFirstNotebook')}
              </Button>
            }
          />
        </div>
      )}

      {/* Edit Dialog */}
      {editingNotebook && (
        <NotebookFormDialog
          trigger={<span />}
          notebook={editingNotebook}
          onSuccess={() => setEditingNotebook(null)}
        />
      )}
    </PageTransition>
  )
}
