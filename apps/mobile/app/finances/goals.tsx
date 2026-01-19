import { useState, useCallback } from 'react'
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
  Target,
  Trash2,
  PartyPopper,
  X,
  Calendar,
} from 'lucide-react-native'
import { useTheme, spacing, radius, typography, cardShadow } from '@/theme'
import { DatePicker } from '@/components/tasks/DatePicker'
import {
  useGoalsQuery,
  useCreateGoal,
  useDeleteGoal,
  useAddContribution,
  type FinancialGoal,
} from '@/hooks'

const GOAL_COLORS = [
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

function formatCurrency(value: number, currency = 'BRL'): string {
  return value.toFixed(2).replace('.', ',')
}

interface GoalItemProps {
  goal: FinancialGoal
  onDelete: () => void
  onAddContribution: () => void
  delay: number
}

function GoalItem({ goal, onDelete, onAddContribution, delay }: GoalItemProps) {
  const { t } = useTranslation()
  const { colors } = useTheme()

  const percentage = Math.round((goal.currentAmount / goal.targetAmount) * 100)
  const remaining = goal.targetAmount - goal.currentAmount
  const isCompleted = goal.completedAt !== null && goal.completedAt !== undefined

  return (
    <View>
      <View style={[styles.goalCard, { backgroundColor: colors.card }, cardShadow]}>
        {/* Header */}
        <View style={styles.goalHeader}>
          <View style={styles.goalInfo}>
            <View style={[styles.goalIcon, { backgroundColor: goal.color + '20' }]}>
              {isCompleted ? (
                <PartyPopper size={20} color={goal.color} />
              ) : (
                <Target size={20} color={goal.color} />
              )}
            </View>
            <View style={styles.goalNameContainer}>
              <Text style={[styles.goalName, { color: colors.foreground }]}>{goal.name}</Text>
              {goal.deadline && (
                <Text style={[styles.goalDeadline, { color: colors.mutedForeground }]}>
                  {new Date(goal.deadline).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              )}
            </View>
          </View>
          <Pressable
            onPress={onDelete}
            style={[styles.deleteButton, { backgroundColor: colors.error + '15' }]}
            hitSlop={8}
          >
            <Trash2 size={16} color={colors.error} />
          </Pressable>
        </View>

        {/* Progress */}
        <View style={styles.goalProgress}>
          <View style={styles.goalValues}>
            <Text style={[styles.currentAmount, { color: goal.color }]}>
              R$ {formatCurrency(goal.currentAmount)}
            </Text>
            <Text style={[styles.targetAmount, { color: colors.mutedForeground }]}>
              / R$ {formatCurrency(goal.targetAmount)}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={[styles.progressContainer, { backgroundColor: colors.muted }]}>
          <View
            style={[
              styles.progressBar,
              {
                backgroundColor: goal.color,
                width: `${Math.min(percentage, 100)}%`,
              },
            ]}
          />
        </View>

        {/* Footer */}
        <View style={styles.goalFooter}>
          <Text style={[styles.progressText, { color: goal.color }]}>
            {isCompleted
              ? t('finances.goal.completed')
              : t('finances.goal.progress', { percent: percentage })}
          </Text>
          {!isCompleted && (
            <Text style={[styles.remainingText, { color: colors.mutedForeground }]}>
              {t('finances.goal.remaining', { amount: `R$ ${formatCurrency(remaining)}` })}
            </Text>
          )}
        </View>

        {/* Add Contribution Button */}
        {!isCompleted && (
          <Pressable
            onPress={onAddContribution}
            style={[styles.addContributionButton, { backgroundColor: goal.color + '15' }]}
          >
            <Plus size={16} color={goal.color} />
            <Text style={[styles.addContributionText, { color: goal.color }]}>
              {t('finances.goal.addContribution')}
            </Text>
          </Pressable>
        )}

        {/* Completed celebration */}
        {isCompleted && (
          <View style={[styles.completedBanner, { backgroundColor: colors.success + '15' }]}>
            <PartyPopper size={16} color={colors.success} />
            <Text style={[styles.completedText, { color: colors.success }]}>
              {t('finances.goal.celebrate')}
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

interface GoalFormProps {
  onSubmit: (data: {
    name: string
    targetAmount: number
    deadline?: string
    color: string
  }) => void
  onCancel: () => void
  isLoading: boolean
}

function GoalForm({ onSubmit, onCancel, isLoading }: GoalFormProps) {
  const { t } = useTranslation()
  const { colors } = useTheme()

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [deadline, setDeadline] = useState<Date | undefined>()
  const [color, setColor] = useState(GOAL_COLORS[4]) // green
  const [showDatePicker, setShowDatePicker] = useState(false)

  const isValid = name.trim().length > 0 && parseFloat(amount.replace(',', '.')) > 0

  const handleSubmit = () => {
    if (!isValid) return
    const parsedAmount = parseFloat(amount.replace(',', '.'))
    onSubmit({
      name: name.trim(),
      targetAmount: parsedAmount,
      deadline: deadline?.toISOString().split('T')[0],
      color,
    })
  }

  return (
    <View style={[styles.formContainer, { backgroundColor: colors.card }, cardShadow]}>
      <View style={styles.formHeader}>
        <Text style={[styles.formTitle, { color: colors.foreground }]}>
          {t('finances.goal.addGoal')}
        </Text>
        <Pressable onPress={onCancel} hitSlop={8}>
          <X size={20} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {/* Name */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {t('finances.goal.name')}
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
          placeholder={t('finances.goal.namePlaceholder')}
          placeholderTextColor={colors.mutedForeground}
          autoFocus
        />
      </View>

      {/* Target Amount */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {t('finances.goal.targetAmount')}
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

      {/* Deadline */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {t('finances.goal.deadline')}
        </Text>
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
          <Text
            style={[
              styles.dateText,
              { color: deadline ? colors.foreground : colors.mutedForeground },
            ]}
          >
            {deadline
              ? deadline.toLocaleDateString()
              : t('finances.transaction.selectDate')}
          </Text>
        </Pressable>
        <DatePicker
          value={deadline}
          onChange={setDeadline}
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          colors={colors}
        />
      </View>

      {/* Color */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {t('finances.goal.color')}
        </Text>
        <View style={styles.colorGrid}>
          {GOAL_COLORS.map((c) => (
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

interface ContributionModalProps {
  goal: FinancialGoal
  onSubmit: (amount: number, note?: string) => void
  onCancel: () => void
  isLoading: boolean
}

function ContributionModal({ goal, onSubmit, onCancel, isLoading }: ContributionModalProps) {
  const { t } = useTranslation()
  const { colors } = useTheme()

  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  const isValid = parseFloat(amount.replace(',', '.')) > 0

  const handleSubmit = () => {
    if (!isValid) return
    const parsedAmount = parseFloat(amount.replace(',', '.'))
    onSubmit(parsedAmount, note.trim() || undefined)
  }

  return (
    <View style={[styles.formContainer, { backgroundColor: colors.card }, cardShadow]}>
      <View style={styles.formHeader}>
        <Text style={[styles.formTitle, { color: colors.foreground }]}>
          {t('finances.goal.addContribution')}
        </Text>
        <Pressable onPress={onCancel} hitSlop={8}>
          <X size={20} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <Text style={[styles.goalLabel, { color: colors.mutedForeground }]}>
        {goal.name}
      </Text>

      {/* Amount */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {t('finances.goal.contributionAmount')}
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
            autoFocus
          />
        </View>
      </View>

      {/* Note */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {t('finances.goal.contributionNote')}
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
          value={note}
          onChangeText={setNote}
          placeholder={t('finances.goal.contributionNote')}
          placeholderTextColor={colors.mutedForeground}
        />
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
            { backgroundColor: isValid ? goal.color : colors.muted },
          ]}
        >
          <Text style={[styles.buttonText, { color: '#fff' }]}>
            {isLoading ? t('common.loading') : t('common.add')}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

function EmptyState({ onAddGoal }: { onAddGoal: () => void }) {
  const { t } = useTranslation()
  const { colors } = useTheme()

  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.success + '15' }]}>
        <Target size={48} color={colors.success} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        {t('finances.goal.noGoals')}
      </Text>
      <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
        {t('finances.goal.emptyDescription')}
      </Text>
      <Pressable
        style={[styles.emptyButton, { backgroundColor: colors.accent }]}
        onPress={onAddGoal}
      >
        <Plus size={20} color={colors.white} />
        <Text style={styles.emptyButtonText}>{t('finances.goal.addGoal')}</Text>
      </Pressable>
    </View>
  )
}

export default function GoalsScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()

  const { data: goals = [], isLoading } = useGoalsQuery()
  const createGoal = useCreateGoal()
  const deleteGoal = useDeleteGoal()
  const addContribution = useAddContribution()

  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contributingGoal, setContributingGoal] = useState<FinancialGoal | null>(null)

  const handleCreateGoal = async (data: {
    name: string
    targetAmount: number
    deadline?: string
    color: string
  }) => {
    setIsSubmitting(true)
    try {
      await createGoal.mutateAsync(data)
      setShowForm(false)
    } catch (error) {
      Alert.alert(t('common.error'), t('finances.transaction.saveError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteGoal = (goal: FinancialGoal) => {
    Alert.alert(
      t('finances.goal.deleteTitle'),
      t('finances.goal.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGoal.mutateAsync(goal.id)
            } catch (error) {
              Alert.alert(t('common.error'), t('finances.transaction.deleteError'))
            }
          },
        },
      ]
    )
  }

  const handleAddContribution = async (amount: number, note?: string) => {
    if (!contributingGoal) return
    setIsSubmitting(true)
    try {
      await addContribution.mutateAsync({
        goalId: contributingGoal.id,
        amount,
        note,
      })
      setContributingGoal(null)
    } catch (error) {
      Alert.alert(t('common.error'), t('finances.transaction.saveError'))
    } finally {
      setIsSubmitting(false)
    }
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
          {t('finances.goal.title')}
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
        {/* Goal Form */}
        {showForm && (
          <GoalForm
            onSubmit={handleCreateGoal}
            onCancel={() => setShowForm(false)}
            isLoading={isSubmitting}
          />
        )}

        {/* Contribution Modal */}
        {contributingGoal && (
          <ContributionModal
            goal={contributingGoal}
            onSubmit={handleAddContribution}
            onCancel={() => setContributingGoal(null)}
            isLoading={isSubmitting}
          />
        )}

        {/* Empty State */}
        {goals.length === 0 && !showForm ? (
          <EmptyState onAddGoal={() => setShowForm(true)} />
        ) : (
          <View style={styles.goalList}>
            {goals.map((goal, index) => (
              <GoalItem
                key={goal.id}
                goal={goal}
                onDelete={() => handleDeleteGoal(goal)}
                onAddContribution={() => setContributingGoal(goal)}
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
  goalList: {
    gap: spacing[4],
  },
  goalCard: {
    padding: spacing[4],
    borderRadius: radius['2xl'],
    gap: spacing[3],
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  goalIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalNameContainer: {
    flex: 1,
  },
  goalName: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
  goalDeadline: {
    fontSize: typography.size.xs,
    marginTop: spacing[0.5],
  },
  deleteButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  goalProgress: {
    marginTop: spacing[1],
  },
  goalValues: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currentAmount: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
  },
  targetAmount: {
    fontSize: typography.size.base,
    marginLeft: spacing[1],
  },
  progressContainer: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 5,
  },
  goalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  remainingText: {
    fontSize: typography.size.xs,
  },
  addContributionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.lg,
  },
  addContributionText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.lg,
  },
  completedText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
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
  goalLabel: {
    fontSize: typography.size.sm,
    marginTop: -spacing[2],
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
  dateButton: {
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
