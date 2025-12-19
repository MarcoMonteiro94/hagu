'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useFinancesStore } from '@/stores/finances'
import { getCategoryById } from '@/config/finance-categories'
import { formatCurrency } from '@/lib/finances'
import { TransactionForm } from './transaction-form'
import type { Transaction } from '@/types/finances'
import {
  MoreHorizontal,
  Trash2,
  Repeat,
  ArrowDownCircle,
  ArrowUpCircle,
  Pencil,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TransactionCardProps {
  transaction: Transaction
}

export function TransactionCard({ transaction }: TransactionCardProps) {
  const t = useTranslations()
  const { deleteTransaction, currency } = useFinancesStore()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const category = getCategoryById(transaction.categoryId)

  const isExpense = transaction.type === 'expense'

  return (
    <Card className="p-3">
      <div className="flex items-center gap-3">
        {/* Category Icon */}
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full',
            isExpense ? 'bg-red-500/10' : 'bg-green-500/10'
          )}
        >
          {isExpense ? (
            <ArrowDownCircle className="h-5 w-5 text-red-500" />
          ) : (
            <ArrowUpCircle className="h-5 w-5 text-green-500" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">
              {transaction.description || t(category?.nameKey || 'finances.transaction')}
            </p>
            {transaction.isRecurring && (
              <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {category && (
              <Badge
                variant="secondary"
                className="text-xs"
                style={{
                  backgroundColor: `${category.color}20`,
                  color: category.color,
                }}
              >
                {t(category.nameKey)}
              </Badge>
            )}
            <span>
              {new Date(transaction.date).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
              })}
            </span>
          </div>
        </div>

        {/* Amount */}
        <div className="text-right">
          <p
            className={cn(
              'font-semibold',
              isExpense ? 'text-red-500' : 'text-green-500'
            )}
          >
            {isExpense ? '-' : '+'}
            {formatCurrency(transaction.amount, currency)}
          </p>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              {t('common.edit')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => deleteTransaction(transaction.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('common.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Edit Dialog */}
        <TransactionForm
          transaction={transaction}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          trigger={null}
        />
      </div>
    </Card>
  )
}
