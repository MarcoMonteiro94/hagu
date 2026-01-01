'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useNotebooksWithPageCount } from '@/hooks/queries/use-notebooks'
import { BookOpen, ChevronRight, Plus } from 'lucide-react'

export function NotebooksWidget() {
  const t = useTranslations('home')
  const tStudies = useTranslations('studies')
  const { data: notebooks = [], isLoading } = useNotebooksWithPageCount()

  // Show only the 4 most recent notebooks
  const recentNotebooks = notebooks.slice(0, 4)

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{tStudies('notebooks')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{tStudies('notebooks')}</CardTitle>
          <Link href="/areas/studies">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentNotebooks.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {t('noNotebooks')}
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {recentNotebooks.map((notebook) => (
                  <Link
                    key={notebook.id}
                    href={`/areas/studies/${notebook.id}`}
                    className="group flex items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-accent/50"
                    style={{ borderLeftColor: notebook.color ?? '#6366f1', borderLeftWidth: 3 }}
                  >
                    <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{notebook.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {notebook.pageCount} {notebook.pageCount === 1 ? tStudies('page') : tStudies('pages')}
                      </p>
                    </div>
                  </Link>
                ))}

            </div>
            {notebooks.length > 4 && (
              <Link href="/areas/studies">
                <Button variant="ghost" className="w-full" size="sm">
                  {t('viewAll')}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
