'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageTransition } from '@/components/ui/motion'
import { PageEditor } from '@/components/studies/page-editor'
import {
  useNotebook,
  usePage,
  useUpdatePage,
} from '@/hooks/queries/use-notebooks'
import { useTasksByPage, useSetTaskStatus, useDeleteTask } from '@/hooks/queries/use-tasks'
import { TaskFormDialog } from '@/components/tasks/task-form-dialog'
import type { Block } from '@blocknote/core'
import { ChevronLeft, ListTodo, Save, Loader2, CheckCircle2, Circle, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function PageEditorPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations('studies')
  const notebookId = params.notebookId as string
  const pageId = params.pageId as string

  const [mounted, setMounted] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState<Block[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const initialLoadRef = useRef(true)

  const { data: notebook } = useNotebook(notebookId)
  const { data: page, isLoading } = usePage(pageId)
  const { data: pageTasks = [] } = useTasksByPage(pageId)
  const updateMutation = useUpdatePage()
  const setTaskStatusMutation = useSetTaskStatus()
  const deleteTaskMutation = useDeleteTask()
  const [showTaskDialog, setShowTaskDialog] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (page && initialLoadRef.current) {
      setTitle(page.title)
      setContent(page.content)
      initialLoadRef.current = false
    }
  }, [page])

  const saveChanges = useCallback(async () => {
    if (!hasUnsavedChanges || isSaving) return

    setIsSaving(true)
    try {
      await updateMutation.mutateAsync({
        id: pageId,
        notebookId,
        data: {
          title: title.trim() || t('untitled'),
          content,
        },
      })
      setHasUnsavedChanges(false)
      toast.success(t('saved'))
    } catch {
      toast.error(t('saveError'))
    } finally {
      setIsSaving(false)
    }
  }, [hasUnsavedChanges, isSaving, pageId, notebookId, title, content, updateMutation, t])

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    setHasUnsavedChanges(true)
  }

  const handleContentChange = (newContent: Block[]) => {
    setContent(newContent)
    setHasUnsavedChanges(true)
  }

  const handleCreateTask = () => {
    setShowTaskDialog(true)
  }

  // Extract text content from blocks for task description
  const getDescriptionText = () => {
    return content
      .map((block) => {
        if (!block.content) return ''
        if ('text' in block.content && typeof block.content.text === 'string') {
          return block.content.text
        }
        if (Array.isArray(block.content)) {
          return block.content
            .map((item) => (typeof item === 'object' && 'text' in item ? item.text : ''))
            .join('')
        }
        return ''
      })
      .filter(Boolean)
      .slice(0, 3) // Take first 3 blocks for description
      .join('\n')
      .slice(0, 500) // Limit description length
  }

  const handleTaskCreated = () => {
    toast.success(t('taskCreated'), {
      description: t('taskCreatedDescription'),
      action: {
        label: 'View',
        onClick: () => router.push('/tasks'),
      },
    })
  }

  const handleToggleTask = (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'done' ? 'pending' : 'done'
    setTaskStatusMutation.mutate({ id: taskId, status: newStatus as 'pending' | 'done' })
  }

  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId, {
      onSuccess: () => {
        toast.success(t('taskDeleted'))
      },
    })
  }

  // Keyboard shortcut for save (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        saveChanges()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [saveChanges])

  if (!mounted || isLoading) {
    return (
      <div className="container mx-auto max-w-4xl p-4 lg:p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-12 bg-muted rounded" />
          <div className="h-[400px] bg-muted rounded-lg" />
        </div>
      </div>
    )
  }

  if (!page) {
    return (
      <div className="container mx-auto max-w-4xl p-4 lg:p-6">
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold mb-2">{t('pageNotFound')}</h2>
          <Link href={`/areas/studies/${notebookId}`}>
            <Button variant="outline">{t('backToNotebook')}</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <PageTransition className="container mx-auto max-w-4xl space-y-6 p-4 lg:p-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/areas/studies/${notebookId}`}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {notebook?.title || t('backToNotebook')}
        </Link>

        <div className="flex items-center gap-2">
          {/* Create Task button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateTask}
          >
            <ListTodo className="mr-2 h-4 w-4" />
            {t('newTask')}
          </Button>

          {/* Save button */}
          <Button
            variant="outline"
            size="sm"
            onClick={saveChanges}
            disabled={!hasUnsavedChanges || isSaving}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {t('save')}
          </Button>
        </div>
      </header>

      {/* Title */}
      <div className="group">
        <Input
          value={title}
          onChange={handleTitleChange}
          placeholder={t('pageTitlePlaceholder')}
          className="text-3xl font-bold h-auto py-2 border-none shadow-none focus-visible:ring-0 px-0 !bg-transparent dark:!bg-transparent placeholder:text-muted-foreground/50"
        />
        <div className="h-px bg-border/50 group-focus-within:bg-primary/50 transition-colors" />
      </div>

      {/* Editor */}
      <div className="flex-1">
        <PageEditor
          initialContent={page.content}
          onChange={handleContentChange}
        />
      </div>

      {/* Related Tasks - Compact inline list */}
      {pageTasks.length > 0 && (
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
            <ListTodo className="h-4 w-4" />
            <span>{t('relatedTasks')}</span>
            <span className="bg-muted px-1.5 py-0.5 rounded text-xs">
              {pageTasks.filter(task => task.status !== 'done').length}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {pageTasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  'inline-flex items-center gap-2 px-2 py-1 rounded-md border text-sm group hover:bg-muted/50',
                  task.status === 'done' && 'opacity-50'
                )}
              >
                <button
                  onClick={() => handleToggleTask(task.id, task.status)}
                  className="shrink-0"
                >
                  {task.status === 'done' ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                  )}
                </button>
                <span className={cn(task.status === 'done' && 'line-through text-muted-foreground')}>
                  {task.title}
                </span>
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Creation Dialog */}
      <TaskFormDialog
        open={showTaskDialog}
        onOpenChange={setShowTaskDialog}
        defaultTitle={title.trim() || t('untitled')}
        defaultDescription={getDescriptionText()}
        defaultTags={['from-notes']}
        notebookId={notebookId}
        pageId={pageId}
        onSuccess={handleTaskCreated}
      >
        <span className="hidden" />
      </TaskFormDialog>
    </PageTransition>
  )
}
