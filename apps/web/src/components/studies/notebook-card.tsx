'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import type { NotebookWithPageCount } from '@/types'
import { Book, MoreVertical, Pencil, Trash2, FileText } from 'lucide-react'
import { useState } from 'react'

interface NotebookCardProps {
  notebook: NotebookWithPageCount
  onEdit: (notebook: NotebookWithPageCount) => void
  onDelete: (id: string) => void
}

export function NotebookCard({ notebook, onEdit, onDelete }: NotebookCardProps) {
  const t = useTranslations('studies')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  return (
    <>
      <Card
        className="group relative overflow-hidden transition-all hover:shadow-md"
        style={{ borderLeftColor: notebook.color, borderLeftWidth: 4 }}
      >
        <Link href={`/areas/studies/${notebook.id}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${notebook.color}20` }}
                >
                  <Book className="h-5 w-5" style={{ color: notebook.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{notebook.title}</h3>
                  {notebook.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {notebook.description}
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    <span>
                      {notebook.pageCount}{' '}
                      {notebook.pageCount === 1 ? t('page') : t('pages')}
                    </span>
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault()
                      onEdit(notebook)
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    {t('editNotebook')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => {
                      e.preventDefault()
                      setShowDeleteDialog(true)
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t('deleteNotebook')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Link>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteNotebookTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteNotebookDescription', { title: notebook.title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onDelete(notebook.id)}
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
