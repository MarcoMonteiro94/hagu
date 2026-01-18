'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { NotebookPageSummary } from '@/types'
import { FileText, MoreVertical, Pencil, Trash2, GripVertical } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR, enUS } from 'date-fns/locale'

interface SortablePageListItemProps {
  page: NotebookPageSummary
  notebookId: string
  locale: string
  onEdit: (page: NotebookPageSummary) => void
  onDelete: (id: string) => void
}

export function SortablePageListItem({
  page,
  notebookId,
  locale,
  onEdit,
  onDelete,
}: SortablePageListItemProps) {
  const t = useTranslations('studies')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const dateLocale = locale === 'pt-BR' ? ptBR : enUS

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`${isDragging ? 'z-50 opacity-90' : ''}`}
      >
        <div
          className={`group flex items-center justify-between rounded-lg border bg-card p-3 transition-all ${
            isDragging
              ? 'scale-[1.02] shadow-lg ring-2 ring-primary'
              : 'hover:bg-accent/50'
          }`}
        >
          <button
            className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing mr-2"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </button>

          <Link
            href={`/areas/studies/${notebookId}/${page.id}`}
            className="flex items-center gap-3 flex-1 min-w-0"
          >
            <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="font-medium truncate">{page.title}</h3>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(page.updatedAt), {
                  addSuffix: true,
                  locale: dateLocale,
                })}
              </p>
            </div>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(page)}>
                <Pencil className="mr-2 h-4 w-4" />
                {t('renamePage')}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('deletePage')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deletePageTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deletePageDescription', { title: page.title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onDelete(page.id)}
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
