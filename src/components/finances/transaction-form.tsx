'use client'

import { useState, useEffect } from 'react'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSettings } from '@/hooks/queries/use-settings'
import { useCreateTransaction, useUpdateTransaction } from '@/hooks/queries/use-finances'
import { getCategoriesByType, PAYMENT_METHODS } from '@/config/finance-categories'
import { getTodayString } from '@/lib/finances'
import type { Transaction, TransactionType, RecurrenceFrequency } from '@/types/finances'
import { Plus, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'

interface TransactionFormProps {
  trigger?: React.ReactNode
  defaultType?: TransactionType
  onSuccess?: () => void
  /** Transaction to edit (if provided, form enters edit mode) */
  transaction?: Transaction
  /** Control dialog open state externally */
  open?: boolean
  /** Callback when dialog open state changes */
  onOpenChange?: (open: boolean) => void
}

const RECURRENCE_OPTIONS: { value: RecurrenceFrequency; labelKey: string }[] = [
  { value: 'daily', labelKey: 'finances.recurrence.daily' },
  { value: 'weekly', labelKey: 'finances.recurrence.weekly' },
  { value: 'biweekly', labelKey: 'finances.recurrence.biweekly' },
  { value: 'monthly', labelKey: 'finances.recurrence.monthly' },
  { value: 'yearly', labelKey: 'finances.recurrence.yearly' },
]

export function TransactionForm({
  trigger,
  defaultType = 'expense',
  onSuccess,
  transaction,
  open: controlledOpen,
  onOpenChange,
}: TransactionFormProps) {
  const t = useTranslations()
  const { data: settings } = useSettings()
  const createTransaction = useCreateTransaction()
  const updateTransactionMutation = useUpdateTransaction()

  const currency = settings?.currency ?? 'BRL'
  const isEditMode = !!transaction
  const [internalOpen, setInternalOpen] = useState(false)

  // Support both controlled and uncontrolled dialog state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  const [type, setType] = useState<TransactionType>(transaction?.type || defaultType)
  const [amount, setAmount] = useState(transaction?.amount?.toString() || '')
  const [categoryId, setCategoryId] = useState(transaction?.categoryId || '')
  const [description, setDescription] = useState(transaction?.description || '')
  const [date, setDate] = useState(transaction?.date || getTodayString())
  const [paymentMethod, setPaymentMethod] = useState(transaction?.paymentMethod || '')
  const [isRecurring, setIsRecurring] = useState(transaction?.isRecurring || false)
  const [recurrenceFrequency, setRecurrenceFrequency] =
    useState<RecurrenceFrequency>(transaction?.recurrence?.frequency || 'monthly')

  // Reset form when transaction prop changes (for edit mode)
  useEffect(() => {
    if (transaction) {
      setType(transaction.type)
      setAmount(transaction.amount.toString())
      setCategoryId(transaction.categoryId)
      setDescription(transaction.description)
      setDate(transaction.date)
      setPaymentMethod(transaction.paymentMethod || '')
      setIsRecurring(transaction.isRecurring)
      setRecurrenceFrequency(transaction.recurrence?.frequency || 'monthly')
    }
  }, [transaction])

  const categories = getCategoriesByType(type)

  function resetForm() {
    if (!isEditMode) {
      setType(defaultType)
      setAmount('')
      setCategoryId('')
      setDescription('')
      setDate(getTodayString())
      setPaymentMethod('')
      setIsRecurring(false)
      setRecurrenceFrequency('monthly')
    }
  }

  function handleTypeChange(newType: TransactionType) {
    setType(newType)
    setCategoryId('') // Reset category when type changes
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const numericAmount = parseFloat(amount.replace(',', '.'))
    if (isNaN(numericAmount) || numericAmount <= 0) return
    if (!categoryId) return

    const transactionData = {
      type,
      amount: numericAmount,
      categoryId,
      description,
      date,
      paymentMethod: paymentMethod || undefined,
      isRecurring,
      recurrence: isRecurring
        ? { frequency: recurrenceFrequency }
        : undefined,
    }

    try {
      if (isEditMode && transaction) {
        // Update existing transaction
        await updateTransactionMutation.mutateAsync({
          id: transaction.id,
          updates: transactionData,
        })
      } else {
        // Add new transaction
        await createTransaction.mutateAsync(transactionData)
      }

      resetForm()
      setOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error('Failed to save transaction:', error)
    }
  }

  const isSubmitting = createTransaction.isPending || updateTransactionMutation.isPending

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== null && (
        <DialogTrigger asChild>
          {trigger || (
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('finances.addTransaction')}
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? t('finances.editTransaction') : t('finances.addTransaction')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selection */}
          <Tabs
            value={type}
            onValueChange={(v) => handleTypeChange(v as TransactionType)}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="expense" className="gap-2">
                <ArrowDownCircle className="h-4 w-4 text-red-500" />
                {t('finances.expense')}
              </TabsTrigger>
              <TabsTrigger value="income" className="gap-2">
                <ArrowUpCircle className="h-4 w-4 text-green-500" />
                {t('finances.income')}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">{t('finances.amount')}</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {currency === 'BRL' ? 'R$' : currency === 'USD' ? '$' : '€'}
              </span>
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10 text-lg font-medium"
                required
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>{t('finances.category')}</Label>
            <Select value={categoryId} onValueChange={setCategoryId} required>
              <SelectTrigger>
                <SelectValue placeholder={t('finances.selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {t(cat.nameKey)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t('finances.description')}</Label>
            <Textarea
              id="description"
              placeholder={t('finances.descriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">{t('finances.date')}</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Payment Method (only for expenses) */}
          {type === 'expense' && (
            <div className="space-y-2">
              <Label>{t('finances.paymentMethod')}</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder={t('finances.selectPaymentMethod')} />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {t(method.nameKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Recurring */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label htmlFor="recurring">{t('finances.recurring')}</Label>
              <p className="text-xs text-muted-foreground">
                {t('finances.recurringDescription')}
              </p>
            </div>
            <Switch
              id="recurring"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
          </div>

          {/* Recurrence Frequency */}
          {isRecurring && (
            <div className="space-y-2">
              <Label>{t('finances.frequency')}</Label>
              <Select
                value={recurrenceFrequency}
                onValueChange={(v) =>
                  setRecurrenceFrequency(v as RecurrenceFrequency)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECURRENCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {t(opt.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting
              ? t('common.saving')
              : isEditMode
                ? t('finances.saveChanges')
                : type === 'expense'
                  ? t('finances.addExpense')
                  : t('finances.addIncome')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
