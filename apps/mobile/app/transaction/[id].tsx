import { useState, useCallback } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  X,
  Trash2,
  Edit3,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Tag,
  Repeat,
} from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useTheme, spacing, radius, typography, cardShadow } from '@/theme'
import { TransactionForm, type TransactionFormData } from '@/components/finances'
import {
  useTransactionQuery,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useCategoriesQuery,
} from '@/hooks'

function formatCurrency(value: number): string {
  return value.toFixed(2).replace('.', ',')
}

export default function TransactionModal() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { t } = useTranslation()
  const { colors } = useTheme()

  const isNew = id === 'new'
  const { data: transaction, isLoading: isLoadingTransaction } = useTransactionQuery(
    isNew ? undefined : id
  )
  const { data: categories = [] } = useCategoriesQuery()

  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()
  const deleteTransaction = useDeleteTransaction()

  const [isEditing, setIsEditing] = useState(isNew)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const category = categories.find((c) => c.id === transaction?.categoryId)

  const handleSubmit = async (data: TransactionFormData) => {
    setIsSubmitting(true)
    try {
      if (isNew) {
        await createTransaction.mutateAsync(data)
        router.back()
      } else {
        await updateTransaction.mutateAsync({ id, updates: data })
        setIsEditing(false)
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('finances.transaction.saveError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = () => {
    Alert.alert(
      t('finances.transaction.deleteTitle'),
      t('finances.transaction.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction.mutateAsync(id)
              router.back()
            } catch (error) {
              Alert.alert(t('common.error'), t('finances.transaction.deleteError'))
            }
          },
        },
      ]
    )
  }

  const handleCancel = useCallback(() => {
    if (isNew) {
      router.back()
    } else {
      setIsEditing(false)
    }
  }, [isNew])

  // Show loading state
  if (!isNew && isLoadingTransaction) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    )
  }

  // Show form if editing or new
  if (isEditing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            headerShown: false,
            presentation: 'modal',
            animation: 'slide_from_bottom',
          }}
        />

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleCancel} style={styles.iconButton} hitSlop={8}>
            <X size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {isNew ? t('finances.addTransaction') : t('finances.editTransaction')}
          </Text>
          <View style={styles.iconButton} />
        </View>

        <TransactionForm
          transaction={transaction}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isSubmitting}
        />
      </SafeAreaView>
    )
  }

  // Show detail view
  const isIncome = transaction?.type === 'income'

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton} hitSlop={8}>
          <X size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {t('finances.transaction.type')}
        </Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => setIsEditing(true)} style={styles.iconButton} hitSlop={8}>
            <Edit3 size={20} color={colors.foreground} />
          </Pressable>
          <Pressable onPress={handleDelete} style={styles.iconButton} hitSlop={8}>
            <Trash2 size={20} color={colors.error} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {transaction && (
          <>
            {/* Amount Card */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(400)}
              style={[
                styles.amountCard,
                {
                  backgroundColor: isIncome ? colors.success + '15' : colors.error + '15',
                  borderColor: isIncome ? colors.success + '30' : colors.error + '30',
                },
              ]}
            >
              <View style={styles.amountHeader}>
                {isIncome ? (
                  <ArrowUpRight size={24} color={colors.success} />
                ) : (
                  <ArrowDownRight size={24} color={colors.error} />
                )}
                <Text style={[styles.typeLabel, { color: isIncome ? colors.success : colors.error }]}>
                  {t(`finances.${transaction.type}`)}
                </Text>
              </View>
              <Text
                style={[styles.amountValue, { color: isIncome ? colors.success : colors.error }]}
              >
                {isIncome ? '+' : '-'}R$ {formatCurrency(transaction.amount)}
              </Text>
            </Animated.View>

            {/* Description */}
            <Animated.View
              entering={FadeInDown.delay(150).duration(400)}
              style={[styles.detailCard, { backgroundColor: colors.card }, cardShadow]}
            >
              <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                {t('finances.transaction.description')}
              </Text>
              <Text style={[styles.detailValue, { color: colors.foreground }]}>
                {transaction.description}
              </Text>
            </Animated.View>

            {/* Category */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(400)}
              style={[styles.detailCard, { backgroundColor: colors.card }, cardShadow]}
            >
              <View style={styles.detailRow}>
                <Tag size={18} color={colors.mutedForeground} />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                    {t('finances.transaction.category')}
                  </Text>
                  <View style={styles.categoryValue}>
                    {category && (
                      <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                    )}
                    <Text style={[styles.detailValue, { color: colors.foreground }]}>
                      {category
                        ? t(`finances.category.defaultCategories.${category.nameKey}`, {
                            defaultValue: category.name,
                          })
                        : '-'}
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Date */}
            <Animated.View
              entering={FadeInDown.delay(250).duration(400)}
              style={[styles.detailCard, { backgroundColor: colors.card }, cardShadow]}
            >
              <View style={styles.detailRow}>
                <Calendar size={18} color={colors.mutedForeground} />
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                    {t('finances.transaction.date')}
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>
                    {new Date(transaction.date).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
            </Animated.View>

            {/* Recurring */}
            {transaction.isRecurring && transaction.recurrence && (
              <Animated.View
                entering={FadeInDown.delay(300).duration(400)}
                style={[styles.detailCard, { backgroundColor: colors.card }, cardShadow]}
              >
                <View style={styles.detailRow}>
                  <Repeat size={18} color={colors.mutedForeground} />
                  <View style={styles.detailContent}>
                    <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
                      {t('finances.transaction.recurring')}
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.foreground }]}>
                      {t(`finances.transaction.${transaction.recurrence.frequency}`)}
                    </Text>
                  </View>
                </View>
              </Animated.View>
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
  headerActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing[6],
    gap: spacing[4],
  },
  amountCard: {
    padding: spacing[6],
    borderRadius: radius['2xl'],
    borderWidth: 1,
    alignItems: 'center',
  },
  amountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  typeLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
  },
  amountValue: {
    fontSize: typography.size['4xl'],
    fontWeight: typography.weight.bold,
  },
  detailCard: {
    padding: spacing[4],
    borderRadius: radius.xl,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    marginBottom: spacing[1],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
  },
  categoryValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
})
