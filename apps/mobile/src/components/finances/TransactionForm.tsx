import { useState, useEffect, useMemo } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  Calendar,
  X,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Tag,
  Repeat,
} from 'lucide-react-native'
import { useTheme, spacing, radius, typography } from '@/theme'
import { DatePicker } from '../tasks/DatePicker'
import { useCategoriesQuery } from '@/hooks'
import type {
  Transaction,
  TransactionType,
  TransactionCategory,
  RecurrenceFrequency,
} from '@hagu/core'

const TRANSACTION_TYPES: TransactionType[] = ['income', 'expense']

const FREQUENCIES: RecurrenceFrequency[] = ['daily', 'weekly', 'monthly', 'yearly']

export interface TransactionFormData {
  type: TransactionType
  amount: number
  categoryId: string
  description: string
  date: string
  paymentMethod?: string
  tags?: string[]
  isRecurring: boolean
  recurrence?: {
    frequency: RecurrenceFrequency
    nextDate?: string
    endDate?: string
  }
}

interface TransactionFormProps {
  transaction?: Transaction | null
  onSubmit: (data: TransactionFormData) => void
  onCancel: () => void
  isLoading?: boolean
}

export function TransactionForm({
  transaction,
  onSubmit,
  onCancel,
  isLoading,
}: TransactionFormProps) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const { data: allCategories = [] } = useCategoriesQuery()

  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'expense')
  const [amount, setAmount] = useState(transaction?.amount?.toString() ?? '')
  const [description, setDescription] = useState(transaction?.description ?? '')
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? '')
  const [date, setDate] = useState<Date | undefined>(
    transaction?.date ? new Date(transaction.date) : new Date()
  )
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [isRecurring, setIsRecurring] = useState(transaction?.isRecurring ?? false)
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(
    transaction?.recurrence?.frequency ?? 'monthly'
  )
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false)

  // Filter categories by type
  const categories = useMemo(
    () => allCategories.filter((cat) => cat.type === type),
    [allCategories, type]
  )

  const selectedCategory = categories.find((c) => c.id === categoryId)

  // Reset category when type changes if current category doesn't match
  useEffect(() => {
    if (categoryId && !categories.find((c) => c.id === categoryId)) {
      setCategoryId('')
    }
  }, [type, categories, categoryId])

  useEffect(() => {
    if (transaction) {
      setType(transaction.type)
      setAmount(transaction.amount.toString())
      setDescription(transaction.description)
      setCategoryId(transaction.categoryId)
      setDate(new Date(transaction.date))
      setIsRecurring(transaction.isRecurring)
      if (transaction.recurrence) {
        setFrequency(transaction.recurrence.frequency)
      }
    }
  }, [transaction])

  const handleSubmit = () => {
    const parsedAmount = parseFloat(amount.replace(',', '.'))
    if (!parsedAmount || !categoryId || !description.trim() || !date) return

    onSubmit({
      type,
      amount: parsedAmount,
      categoryId,
      description: description.trim(),
      date: date.toISOString().split('T')[0],
      isRecurring,
      recurrence: isRecurring
        ? {
            frequency,
          }
        : undefined,
    })
  }

  const handleAmountChange = (text: string) => {
    // Allow only numbers, comma, and period
    const cleaned = text.replace(/[^0-9.,]/g, '')
    setAmount(cleaned)
  }

  const isValid =
    amount.trim().length > 0 &&
    parseFloat(amount.replace(',', '.')) > 0 &&
    categoryId.length > 0 &&
    description.trim().length > 0 &&
    !!date

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Transaction Type */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {t('finances.transaction.type')}
        </Text>
        <View style={styles.typeRow}>
          {TRANSACTION_TYPES.map((typeOption) => {
            const isSelected = type === typeOption
            const typeColor = typeOption === 'income' ? colors.success : colors.error
            const Icon = typeOption === 'income' ? ArrowUpRight : ArrowDownRight
            return (
              <Pressable
                key={typeOption}
                onPress={() => setType(typeOption)}
                style={[
                  styles.typeButton,
                  {
                    backgroundColor: isSelected ? typeColor + '20' : colors.secondary,
                    borderColor: isSelected ? typeColor : colors.border,
                  },
                ]}
              >
                <Icon size={18} color={isSelected ? typeColor : colors.mutedForeground} />
                <Text
                  style={[
                    styles.typeText,
                    { color: isSelected ? typeColor : colors.mutedForeground },
                  ]}
                >
                  {t(`finances.${typeOption}`)}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      {/* Amount */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {t('finances.transaction.amount')}
        </Text>
        <View
          style={[
            styles.amountContainer,
            {
              backgroundColor: colors.secondary,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.currencyPrefix, { color: colors.mutedForeground }]}>R$</Text>
          <TextInput
            style={[styles.amountInput, { color: colors.foreground }]}
            value={amount}
            onChangeText={handleAmountChange}
            placeholder={t('finances.transaction.amountPlaceholder')}
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
            autoFocus={!transaction}
          />
        </View>
      </View>

      {/* Description */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {t('finances.transaction.description')}
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.secondary,
              color: colors.foreground,
              borderColor: colors.border,
            },
          ]}
          value={description}
          onChangeText={setDescription}
          placeholder={t('finances.transaction.descriptionPlaceholder')}
          placeholderTextColor={colors.mutedForeground}
        />
      </View>

      {/* Category */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {t('finances.transaction.category')}
        </Text>
        <Pressable
          onPress={() => setShowCategoryPicker(!showCategoryPicker)}
          style={[
            styles.selectButton,
            {
              backgroundColor: colors.secondary,
              borderColor: selectedCategory ? selectedCategory.color : colors.border,
            },
          ]}
        >
          {selectedCategory ? (
            <>
              <View
                style={[styles.categoryDot, { backgroundColor: selectedCategory.color }]}
              />
              <Text style={[styles.selectText, { color: colors.foreground }]}>
                {t(`finances.category.defaultCategories.${selectedCategory.nameKey}`, {
                  defaultValue: selectedCategory.name,
                })}
              </Text>
            </>
          ) : (
            <>
              <Tag size={18} color={colors.mutedForeground} />
              <Text style={[styles.selectText, { color: colors.mutedForeground }]}>
                {t('finances.transaction.selectCategory')}
              </Text>
            </>
          )}
          <ChevronDown size={18} color={colors.mutedForeground} />
        </Pressable>

        {showCategoryPicker && (
          <View
            style={[
              styles.optionsList,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {categories.length === 0 ? (
              <View style={styles.emptyCategories}>
                <Text style={[styles.emptyCategoriesText, { color: colors.mutedForeground }]}>
                  {t('finances.category.noCategories')}
                </Text>
              </View>
            ) : (
              categories.map((category) => (
                <Pressable
                  key={category.id}
                  onPress={() => {
                    setCategoryId(category.id)
                    setShowCategoryPicker(false)
                  }}
                  style={[
                    styles.optionItem,
                    categoryId === category.id && { backgroundColor: colors.secondary },
                  ]}
                >
                  <View
                    style={[styles.categoryDot, { backgroundColor: category.color }]}
                  />
                  <Text style={[styles.optionText, { color: colors.foreground }]}>
                    {t(`finances.category.defaultCategories.${category.nameKey}`, {
                      defaultValue: category.name,
                    })}
                  </Text>
                </Pressable>
              ))
            )}
          </View>
        )}
      </View>

      {/* Date */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {t('finances.transaction.date')}
        </Text>
        <View style={styles.dateRow}>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={[
              styles.dateButton,
              {
                backgroundColor: colors.secondary,
                borderColor: colors.border,
              },
            ]}
          >
            <Calendar size={18} color={colors.mutedForeground} />
            <Text style={[styles.dateText, { color: colors.foreground }]}>
              {date?.toLocaleDateString() ?? t('finances.transaction.selectDate')}
            </Text>
          </Pressable>
        </View>
        <DatePicker
          value={date}
          onChange={setDate}
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          colors={colors}
        />
      </View>

      {/* Recurring */}
      <View style={styles.field}>
        <View style={styles.switchRow}>
          <View style={styles.switchLabel}>
            <Repeat size={18} color={colors.mutedForeground} />
            <Text style={[styles.label, { color: colors.foreground, marginBottom: 0 }]}>
              {t('finances.transaction.recurring')}
            </Text>
          </View>
          <Switch
            value={isRecurring}
            onValueChange={setIsRecurring}
            trackColor={{ false: colors.muted, true: colors.accent + '60' }}
            thumbColor={isRecurring ? colors.accent : colors.mutedForeground}
          />
        </View>
        <Text style={[styles.switchDescription, { color: colors.mutedForeground }]}>
          {t('finances.transaction.isRecurring')}
        </Text>
      </View>

      {/* Frequency (when recurring) */}
      {isRecurring && (
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            {t('finances.transaction.frequency')}
          </Text>
          <Pressable
            onPress={() => setShowFrequencyPicker(!showFrequencyPicker)}
            style={[
              styles.selectButton,
              {
                backgroundColor: colors.secondary,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.selectText, { color: colors.foreground }]}>
              {t(`finances.transaction.${frequency}`)}
            </Text>
            <ChevronDown size={18} color={colors.mutedForeground} />
          </Pressable>

          {showFrequencyPicker && (
            <View
              style={[
                styles.optionsList,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              {FREQUENCIES.map((freq) => (
                <Pressable
                  key={freq}
                  onPress={() => {
                    setFrequency(freq)
                    setShowFrequencyPicker(false)
                  }}
                  style={[
                    styles.optionItem,
                    frequency === freq && { backgroundColor: colors.secondary },
                  ]}
                >
                  <Text style={[styles.optionText, { color: colors.foreground }]}>
                    {t(`finances.transaction.${freq}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          onPress={onCancel}
          style={[styles.button, styles.cancelButton, { backgroundColor: colors.secondary }]}
        >
          <Text style={[styles.buttonText, { color: colors.foreground }]}>
            {t('common.cancel')}
          </Text>
        </Pressable>
        <Pressable
          onPress={handleSubmit}
          disabled={!isValid || isLoading}
          style={[
            styles.button,
            styles.submitButton,
            { backgroundColor: isValid ? colors.primary : colors.muted },
          ]}
        >
          <Text style={[styles.buttonText, styles.submitButtonText]}>
            {isLoading ? t('common.loading') : t('common.save')}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing[6],
    gap: spacing[5],
  },
  field: {
    gap: spacing[2],
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    marginBottom: spacing[1],
  },
  input: {
    fontSize: typography.size.base,
    padding: spacing[3.5],
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3.5],
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  currencyPrefix: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginRight: spacing[2],
  },
  amountInput: {
    flex: 1,
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.semibold,
    padding: 0,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    padding: spacing[3.5],
    borderRadius: radius.xl,
    borderWidth: 1.5,
  },
  typeText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2.5],
    padding: spacing[3.5],
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  selectText: {
    flex: 1,
    fontSize: typography.size.base,
  },
  optionsList: {
    marginTop: spacing[2],
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2.5],
    padding: spacing[3.5],
  },
  optionText: {
    fontSize: typography.size.sm,
  },
  emptyCategories: {
    padding: spacing[4],
    alignItems: 'center',
  },
  emptyCategoriesText: {
    fontSize: typography.size.sm,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2.5],
    padding: spacing[3.5],
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  dateText: {
    fontSize: typography.size.base,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  switchDescription: {
    fontSize: typography.size.sm,
    marginTop: spacing[1],
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[4],
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[3.5],
    borderRadius: radius.xl,
  },
  cancelButton: {},
  submitButton: {},
  buttonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  submitButtonText: {
    color: '#fff',
  },
})
