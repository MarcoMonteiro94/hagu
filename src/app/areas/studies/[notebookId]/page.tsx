'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PageTransition, StaggerContainer, StaggerItem } from '@/components/ui/motion'
import { PageListItem } from '@/components/studies/page-list-item'
import { PageFormDialog } from '@/components/studies/page-form-dialog'
import {
  useNotebook,
  usePages,
  useDeletePage,
} from '@/hooks/queries/use-notebooks'
import { useHabitsByNotebook } from '@/hooks/queries/use-habits'
import { useTasksByNotebook } from '@/hooks/queries/use-tasks'
import type { NotebookPageSummary } from '@/types'
import { Plus, ChevronLeft, FileText, Book, Activity, ListTodo } from 'lucide-react'
import { toast } from 'sonner'

export default function NotebookPage() {
  const params = useParams()
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('studies')
  const notebookId = params.notebookId as string

  const [mounted, setMounted] = useState(false)
  const [editingPage, setEditingPage] = useState<NotebookPageSummary | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const { data: notebook, isLoading: isLoadingNotebook } = useNotebook(notebookId)
  const { data: pages, isLoading: isLoadingPages } = usePages(notebookId)
  const { data: linkedHabits = [] } = useHabitsByNotebook(notebookId)
  const { data: notebookTasks = [] } = useTasksByNotebook(notebookId)
  const deleteMutation = useDeletePage()

  const pendingTasks = notebookTasks.filter(task => task.status !== 'done')

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleDeletePage = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id, notebookId })
      toast.success(t('pageDeleted'))
    } catch {
      toast.error(t('deleteError'))
    }
  }

  const handleCreateSuccess = (pageId: string) => {
    router.push(`/areas/studies/${notebookId}/${pageId}`)
  }

  const handleEditPage = (page: NotebookPageSummary) => {
    setEditingPage(page)
    setShowEditDialog(true)
  }

  if (!mounted || isLoadingNotebook || isLoadingPages) {
    return (
      <div className="container mx-auto max-w-4xl p-4 lg:p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!notebook) {
    return (
      <div className="container mx-auto max-w-4xl p-4 lg:p-6">
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold mb-2">{t('notebookNotFound')}</h2>
          <Link href="/areas/studies">
            <Button variant="outline">{t('backToNotebooks')}</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <PageTransition className="container mx-auto max-w-4xl space-y-6 p-4 lg:p-6">
      {/* Header */}
      <header className="space-y-4">
        <Link
          href="/areas/studies"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t('backToNotebooks')}
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${notebook.color}20` }}
            >
              <Book className="h-6 w-6" style={{ color: notebook.color }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{notebook.title}</h1>
              {notebook.description && (
                <p className="text-muted-foreground">{notebook.description}</p>
              )}
            </div>
          </div>
          <PageFormDialog
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('newPage')}
              </Button>
            }
            notebookId={notebookId}
            onSuccess={handleCreateSuccess}
          />
        </div>
      </header>

      {/* Linked Habits Section */}
      {linkedHabits.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {t('linkedHabits')}
          </h2>
          <div className="flex flex-wrap gap-2">
            {linkedHabits.map((habit) => (
              <Link
                key={habit.id}
                href="/habits"
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm border transition-colors hover:bg-muted"
                style={{ borderColor: habit.color }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: habit.color }}
                />
                {habit.title}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Pending Tasks Section */}
      {pendingTasks.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <ListTodo className="h-4 w-4" />
            {t('pendingTasks')}
            <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
              {pendingTasks.length}
            </span>
          </h2>
          <div className="flex flex-wrap gap-2">
            {pendingTasks.map((task) => (
              <Link
                key={task.id}
                href="/tasks"
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm border border-border transition-colors hover:bg-muted"
              >
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                {task.title}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Pages List */}
      {pages && pages.length > 0 ? (
        <StaggerContainer className="space-y-2">
          {pages.map((page) => (
            <StaggerItem key={page.id}>
              <PageListItem
                page={page}
                notebookId={notebookId}
                locale={locale}
                onEdit={handleEditPage}
                onDelete={handleDeletePage}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">{t('noPages')}</h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            {t('noPagesDescription')}
          </p>
          <PageFormDialog
            trigger={
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('createFirstPage')}
              </Button>
            }
            notebookId={notebookId}
            onSuccess={handleCreateSuccess}
          />
        </div>
      )}

      {/* Edit Dialog */}
      {editingPage && (
        <PageFormDialog
          trigger={<span />}
          notebookId={notebookId}
          page={editingPage}
          open={showEditDialog}
          onOpenChange={(open) => {
            setShowEditDialog(open)
            if (!open) setEditingPage(null)
          }}
        />
      )}
    </PageTransition>
  )
}
