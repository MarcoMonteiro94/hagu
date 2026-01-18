import { useState, useCallback, useMemo } from 'react'
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
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Tag,
  X,
} from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useTheme, spacing, radius, typography, cardShadow } from '@/theme'
import {
  useCategoriesQuery,
  useCreateCategory,
  useDeleteCategory,
  useTransactionsQuery,
  type TransactionCategory,
  type TransactionType,
} from '@/hooks'

const CATEGORY_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#84cc16', // lime
  '#22c55e', // green
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#ec4899', // pink
]

const CATEGORY_ICONS = [
  'wallet',
  'briefcase',
  'home',
  'car',
  'utensils',
  'shopping-bag',
  'heart',
  'book',
  'music',
  'film',
  'gift',
  'plane',
]

interface CategoryItemProps {
  category: TransactionCategory
  usageCount: number
  onDelete: () => void
  delay: number
}

function CategoryItem({ category, usageCount, onDelete, delay }: CategoryItemProps) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const isIncome = category.type === 'income'

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)}>
      <View style={[styles.categoryCard, { backgroundColor: colors.card }, cardShadow]}>
        <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
          {isIncome ? (
            <ArrowUpRight size={20} color={category.color} />
          ) : (
            <ArrowDownRight size={20} color={category.color} />
          )}
        </View>
        <View style={styles.categoryContent}>
          <Text style={[styles.categoryName, { color: colors.foreground }]}>
            {t(`finances.category.defaultCategories.${category.nameKey}`, {
              defaultValue: category.name,
            })}
          </Text>
          <Text style={[styles.categoryMeta, { color: colors.mutedForeground }]}>
            {t('finances.category.usageCount', { count: usageCount })}
          </Text>
        </View>
        {category.isCustom && (
          <Pressable
            onPress={onDelete}
            style={[styles.deleteButton, { backgroundColor: colors.error + '15' }]}
            hitSlop={8}
          >
            <Trash2 size={16} color={colors.error} />
          </Pressable>
        )}
      </View>
    </Animated.View>
  )
}

interface CategoryFormProps {
  onSubmit: (data: { name: string; type: TransactionType; color: string }) => void
  onCancel: () => void
  isLoading: boolean
}

function CategoryForm({ onSubmit, onCancel, isLoading }: CategoryFormProps) {
  const { t } = useTranslation()
  const { colors } = useTheme()

  const [name, setName] = useState('')
  const [type, setType] = useState<TransactionType>('expense')
  const [color, setColor] = useState(CATEGORY_COLORS[0])

  const isValid = name.trim().length > 0

  const handleSubmit = () => {
    if (!isValid) return
    onSubmit({
      name: name.trim(),
      type,
      color,
    })
  }

  return (
    <View style={[styles.formContainer, { backgroundColor: colors.card }, cardShadow]}>
      <View style={styles.formHeader}>
        <Text style={[styles.formTitle, { color: colors.foreground }]}>
          {t('finances.category.addCategory')}
        </Text>
        <Pressable onPress={onCancel} hitSlop={8}>
          <X size={20} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {/* Name */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {t('finances.category.name')}
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
          value={name}
          onChangeText={setName}
          placeholder={t('finances.category.namePlaceholder')}
          placeholderTextColor={colors.mutedForeground}
          autoFocus
        />
      </View>

      {/* Type */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {t('finances.category.type')}
        </Text>
        <View style={styles.typeRow}>
          <Pressable
            onPress={() => setType('income')}
            style={[
              styles.typeButton,
              {
                backgroundColor: type === 'income' ? colors.success + '20' : colors.secondary,
                borderColor: type === 'income' ? colors.success : colors.border,
              },
            ]}
          >
            <ArrowUpRight
              size={18}
              color={type === 'income' ? colors.success : colors.mutedForeground}
            />
            <Text
              style={[
                styles.typeText,
                { color: type === 'income' ? colors.success : colors.mutedForeground },
              ]}
            >
              {t('finances.income')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setType('expense')}
            style={[
              styles.typeButton,
              {
                backgroundColor: type === 'expense' ? colors.error + '20' : colors.secondary,
                borderColor: type === 'expense' ? colors.error : colors.border,
              },
            ]}
          >
            <ArrowDownRight
              size={18}
              color={type === 'expense' ? colors.error : colors.mutedForeground}
            />
            <Text
              style={[
                styles.typeText,
                { color: type === 'expense' ? colors.error : colors.mutedForeground },
              ]}
            >
              {t('finances.expense')}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Color */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {t('finances.category.color')}
        </Text>
        <View style={styles.colorGrid}>
          {CATEGORY_COLORS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              style={[
                styles.colorOption,
                { backgroundColor: c },
                color === c && styles.colorOptionSelected,
              ]}
            />
          ))}
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

function EmptyState({ onAddCategory }: { onAddCategory: () => void }) {
  const { t } = useTranslation()
  const { colors } = useTheme()

  return (
    <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.emptyState}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.accent + '15' }]}>
        <Tag size={48} color={colors.accent} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        {t('finances.category.noCategories')}
      </Text>
      <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
        {t('finances.category.emptyDescription')}
      </Text>
      <Pressable
        style={[styles.emptyButton, { backgroundColor: colors.accent }]}
        onPress={onAddCategory}
      >
        <Plus size={20} color={colors.white} />
        <Text style={styles.emptyButtonText}>{t('finances.category.addCategory')}</Text>
      </Pressable>
    </Animated.View>
  )
}

export default function CategoriesScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()

  const { data: categories = [], isLoading } = useCategoriesQuery()
  const { data: transactions = [] } = useTransactionsQuery()
  const createCategory = useCreateCategory()
  const deleteCategory = useDeleteCategory()

  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Count transactions per category
  const usageMap = useMemo(() => {
    const map = new Map<string, number>()
    transactions.forEach((t) => {
      map.set(t.categoryId, (map.get(t.categoryId) || 0) + 1)
    })
    return map
  }, [transactions])

  // Group categories by type
  const incomeCategories = categories.filter((c) => c.type === 'income')
  const expenseCategories = categories.filter((c) => c.type === 'expense')

  const handleCreateCategory = async (data: {
    name: string
    type: TransactionType
    color: string
  }) => {
    setIsSubmitting(true)
    try {
      await createCategory.mutateAsync({
        name: data.name,
        nameKey: data.name.toLowerCase().replace(/\s+/g, '_'),
        type: data.type,
        icon: 'tag',
        color: data.color,
      })
      setShowForm(false)
    } catch (error) {
      Alert.alert(t('common.error'), t('finances.transaction.saveError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCategory = (category: TransactionCategory) => {
    Alert.alert(
      t('finances.category.deleteTitle'),
      t('finances.category.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory.mutateAsync(category.id)
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
          {t('finances.category.title')}
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
        {/* Category Form */}
        {showForm && (
          <CategoryForm
            onSubmit={handleCreateCategory}
            onCancel={() => setShowForm(false)}
            isLoading={isSubmitting}
          />
        )}

        {/* Empty State */}
        {categories.length === 0 && !showForm ? (
          <EmptyState onAddCategory={() => setShowForm(true)} />
        ) : (
          <>
            {/* Income Categories */}
            {incomeCategories.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <ArrowUpRight size={16} color={colors.success} />
                  <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
                    {t('finances.income')}
                  </Text>
                </View>
                <View style={styles.categoryList}>
                  {incomeCategories.map((category, index) => (
                    <CategoryItem
                      key={category.id}
                      category={category}
                      usageCount={usageMap.get(category.id) || 0}
                      onDelete={() => handleDeleteCategory(category)}
                      delay={100 + index * 50}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Expense Categories */}
            {expenseCategories.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <ArrowDownRight size={16} color={colors.error} />
                  <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
                    {t('finances.expense')}
                  </Text>
                </View>
                <View style={styles.categoryList}>
                  {expenseCategories.map((category, index) => (
                    <CategoryItem
                      key={category.id}
                      category={category}
                      usageCount={usageMap.get(category.id) || 0}
                      onDelete={() => handleDeleteCategory(category)}
                      delay={200 + index * 50}
                    />
                  ))}
                </View>
              </View>
            )}
          </>
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
    gap: spacing[6],
  },
  section: {
    gap: spacing[3],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  sectionTitle: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryList: {
    gap: spacing[2.5],
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3.5],
    borderRadius: radius.xl,
    gap: spacing[3.5],
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryContent: {
    flex: 1,
  },
  categoryName: {
    fontSize: typography.size.base - 1,
    fontWeight: typography.weight.medium,
  },
  categoryMeta: {
    fontSize: typography.size.sm - 1,
    marginTop: spacing[0.5],
  },
  deleteButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
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
  input: {
    fontSize: typography.size.base,
    padding: spacing[3.5],
    borderRadius: radius.xl,
    borderWidth: 1,
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
    padding: spacing[3],
    borderRadius: radius.xl,
    borderWidth: 1.5,
  },
  typeText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2.5],
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
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
