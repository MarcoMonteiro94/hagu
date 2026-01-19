import { useState, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Plus,
  CreditCard,
  Trash2,
  AlertTriangle,
  X,
  ChevronDown,
} from 'lucide-react-native'
import { useTheme, spacing, radius, typography, cardShadow } from '@/theme'
import {
  useBudgetsQuery,
  useUpsertBudget,
  useDeleteBudget,
  useCategoriesQuery,
  useTransactionsQuery,
  useBudgetProgress,
  type Budget,
  type TransactionCategory,
} from '@/hooks'

function formatCurrency(value: number, currency = 'BRL'): string {
  return value.toFixed(2).replace('.', ',')
}

function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

interface BudgetItemProps {
  budget: Budget
  category: TransactionCategory | undefined
  spent: number
  percentage: number
  isOverBudget: boolean
  onDelete: () => void
  delay: number
}

function BudgetItem({
  budget,
  category,
  spent,
  percentage,
  isOverBudget,
  onDelete,
  delay,
}: BudgetItemProps) {
  const { t } = useTranslation()
  const { colors } = useTheme()

  const progressColor = isOverBudget
    ? colors.error
    : percentage > 80
    ? colors.warning
    : colors.success

  return (
    <View>
      <View style={[styles.budgetCard, { backgroundColor: colors.card }, cardShadow]}>
        <View style={styles.budgetHeader}>
          <View style={styles.budgetInfo}>
            {category && (
              <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
            )}
            <Text style={[styles.budgetName, { color: colors.foreground }]}>
              {category
                ? t(`finances.category.defaultCategories.${category.nameKey}`, {
                    defaultValue: category.name,
                  })
                : '-'}
            </Text>
          </View>
          <Pressable
            onPress={onDelete}
            style={[styles.deleteButton, { backgroundColor: colors.error + '15' }]}
            hitSlop={8}
          >
            <Trash2 size={16} color={colors.error} />
          </Pressable>
        </View>

        <View style={styles.budgetValues}>
          <View>
            <Text style={[styles.valueLabel, { color: colors.mutedForeground }]}>
              {t('finances.budget.spent')}
            </Text>
            <Text style={[styles.valueAmount, { color: colors.foreground }]}>
              R$ {formatCurrency(spent)}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.valueLabel, { color: colors.mutedForeground }]}>
              {t('finances.budget.monthlyLimit')}
            </Text>
            <Text style={[styles.valueAmount, { color: colors.foreground }]}>
              R$ {formatCurrency(budget.monthlyLimit)}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={[styles.progressContainer, { backgroundColor: colors.muted }]}>
          <View
            style={[
              styles.progressBar,
              {
                backgroundColor: progressColor,
                width: `${Math.min(percentage, 100)}%`,
              },
            ]}
          />
        </View>

        <View style={styles.budgetFooter}>
          <Text style={[styles.progressText, { color: progressColor }]}>
            {t('finances.budget.progress', { percent: Math.round(percentage) })}
          </Text>
          {isOverBudget && (
            <View style={styles.overBudgetBadge}>
              <AlertTriangle size={12} color={colors.error} />
              <Text style={[styles.overBudgetText, { color: colors.error }]}>
                {t('finances.budget.overBudget')}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}

interface BudgetFormProps {
  categories: TransactionCategory[]
  existingBudgetCategoryIds: string[]
  onSubmit: (categoryId: string, monthlyLimit: number) => void
  onCancel: () => void
  isLoading: boolean
}

function BudgetForm({
  categories,
  existingBudgetCategoryIds,
  onSubmit,
  onCancel,
  isLoading,
}: BudgetFormProps) {
  const { t } = useTranslation()
  const { colors } = useTheme()

  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)

  // Only expense categories that don't have a budget yet
  const availableCategories = categories.filter(
    (c) => c.type === 'expense' && !existingBudgetCategoryIds.includes(c.id)
  )

  const selectedCategory = categories.find((c) => c.id === categoryId)

  const isValid = categoryId.length > 0 && parseFloat(amount.replace(',', '.')) > 0

  const handleSubmit = () => {
    if (!isValid) return
    const parsedAmount = parseFloat(amount.replace(',', '.'))
    onSubmit(categoryId, parsedAmount)
  }

  return (
    <View style={[styles.formContainer, { backgroundColor: colors.card }, cardShadow]}>
      <View style={styles.formHeader}>
        <Text style={[styles.formTitle, { color: colors.foreground }]}>
          {t('finances.budget.addBudget')}
        </Text>
        <Pressable onPress={onCancel} hitSlop={8}>
          <X size={20} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {/* Category Picker */}
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
            <Text style={[styles.selectText, { color: colors.mutedForeground }]}>
              {t('finances.transaction.selectCategory')}
            </Text>
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
            {availableCategories.length === 0 ? (
              <View style={styles.emptyOptions}>
                <Text style={[styles.emptyOptionsText, { color: colors.mutedForeground }]}>
                  {t('finances.category.noCategories')}
                </Text>
              </View>
            ) : (
              availableCategories.map((category) => (
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

      {/* Monthly Limit */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {t('finances.budget.monthlyLimit')}
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
            onChangeText={(text) => setAmount(text.replace(/[^0-9.,]/g, ''))}
            placeholder="0,00"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      {/* Actions */}
      <View style={styles.formActions}>
        <Pressable
          onPress={onCancel}
          style={[styles.button, { backgroundColor: colors.secondary }]}
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
            { backgroundColor: isValid ? colors.primary : colors.muted },
          ]}
        >
          <Text style={[styles.buttonText, { color: '#fff' }]}>
            {isLoading ? t('common.loading') : t('common.save')}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

function EmptyState({ onAddBudget }: { onAddBudget: () => void }) {
  const { t } = useTranslation()
  const { colors } = useTheme()

  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.info + '15' }]}>
        <CreditCard size={48} color={colors.info} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        {t('finances.budget.noBudgets')}
      </Text>
      <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
        {t('finances.budget.emptyDescription')}
      </Text>
      <Pressable
        style={[styles.emptyButton, { backgroundColor: colors.accent }]}
        onPress={onAddBudget}
      >
        <Plus size={20} color={colors.white} />
        <Text style={styles.emptyButtonText}>{t('finances.budget.addBudget')}</Text>
      </Pressable>
    </View>
  )
}

export default function BudgetsScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()

  const currentMonth = getCurrentMonth()

  const { data: budgets = [], isLoading } = useBudgetsQuery()
  const { data: categories = [] } = useCategoriesQuery()
  const { data: transactions = [] } = useTransactionsQuery()
  const upsertBudget = useUpsertBudget()
  const deleteBudget = useDeleteBudget()

  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get budgets for current month
  const monthBudgets = budgets.filter((b) => b.month === currentMonth)

  // Calculate progress for each budget
  const budgetProgress = useBudgetProgress(transactions, monthBudgets, categories, currentMonth)

  const existingBudgetCategoryIds = monthBudgets.map((b) => b.categoryId)

  const handleCreateBudget = async (categoryId: string, monthlyLimit: number) => {
    setIsSubmitting(true)
    try {
      await upsertBudget.mutateAsync({
        categoryId,
        monthlyLimit,
        month: currentMonth,
      })
      setShowForm(false)
    } catch (error) {
      Alert.alert(t('common.error'), t('finances.transaction.saveError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteBudget = (budget: Budget) => {
    Alert.alert(
      t('finances.budget.deleteTitle'),
      t('finances.budget.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBudget.mutateAsync(budget.id)
            } catch (error) {
              Alert.alert(t('common.error'), t('finances.transaction.deleteError'))
            }
          },
        },
      ]
    )
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <ArrowLeft size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {t('finances.budget.title')}
        </Text>
        <Pressable
          onPress={() => setShowForm(true)}
          style={[styles.addButton, { backgroundColor: colors.accent }]}
          hitSlop={8}
        >
          <Plus size={20} color={colors.white} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Budget Form */}
        {showForm && (
          <BudgetForm
            categories={categories}
            existingBudgetCategoryIds={existingBudgetCategoryIds}
            onSubmit={handleCreateBudget}
            onCancel={() => setShowForm(false)}
            isLoading={isSubmitting}
          />
        )}

        {/* Empty State */}
        {monthBudgets.length === 0 && !showForm ? (
          <EmptyState onAddBudget={() => setShowForm(true)} />
        ) : (
          <View style={styles.budgetList}>
            {budgetProgress.map((item, index) => (
              <BudgetItem
                key={item.budget.id}
                budget={item.budget}
                category={item.category}
                spent={item.spent}
                percentage={item.percentage}
                isOverBudget={item.isOverBudget}
                onDelete={() => handleDeleteBudget(item.budget)}
                delay={100 + index * 50}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
  addButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[6],
    gap: spacing[4],
  },
  budgetList: {
    gap: spacing[3],
  },
  budgetCard: {
    padding: spacing[4],
    borderRadius: radius.xl,
    gap: spacing[3],
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  budgetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  budgetName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  deleteButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  budgetValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  valueLabel: {
    fontSize: typography.size.xs,
    marginBottom: spacing[0.5],
  },
  valueAmount: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
  progressContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  budgetFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  overBudgetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  overBudgetText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },

  // Form
  formContainer: {
    padding: spacing[5],
    borderRadius: radius['2xl'],
    gap: spacing[4],
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  formTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
  field: {
    gap: spacing[2],
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2.5],
    padding: spacing[3.5],
    borderRadius: radius.xl,
    borderWidth: 1,
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
  emptyOptions: {
    padding: spacing[4],
    alignItems: 'center',
  },
  emptyOptionsText: {
    fontSize: typography.size.sm,
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
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    padding: 0,
  },
  formActions: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[2],
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
  },
  buttonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[12],
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[6],
  },
  emptyTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: typography.size.base,
    textAlign: 'center',
    marginTop: spacing[2],
    lineHeight: 22,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3.5],
    borderRadius: radius.lg,
    marginTop: spacing[6],
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
})
