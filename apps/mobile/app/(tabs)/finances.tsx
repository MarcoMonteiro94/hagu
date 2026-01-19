import { useState, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'expo-router'
import {
  Plus,
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Target,
  CreditCard,
  BarChart3,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react-native'
import { useTheme, cardShadow, spacing, radius, typography } from '@/theme'
import {
  useTransactionsQuery,
  useCategoriesQuery,
  useMonthlyStats,
  useGroupedTransactions,
  type Transaction,
  type TransactionCategory,
} from '@/hooks'

function formatCurrency(value: number): string {
  return value.toFixed(2).replace('.', ',')
}

function formatDate(dateString: string, t: (key: string) => string): string {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (dateString === today.toISOString().split('T')[0]) {
    return t('finances.transaction.today')
  }
  if (dateString === yesterday.toISOString().split('T')[0]) {
    return t('finances.transaction.yesterday')
  }

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })
}

function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

interface TransactionItemProps {
  transaction: Transaction
  category: TransactionCategory | undefined
  delay: number
  onPress: () => void
}

function TransactionItem({ transaction, category, delay, onPress }: TransactionItemProps) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const isIncome = transaction.type === 'income'

  return (
    <View>
      <Pressable onPress={onPress}>
        <View style={[styles.transactionCard, { backgroundColor: colors.card }, cardShadow]}>
          <View
            style={[
              styles.transactionIcon,
              { backgroundColor: isIncome ? colors.success + '15' : colors.error + '15' },
            ]}
          >
            {isIncome ? (
              <ArrowUpRight size={20} color={colors.success} />
            ) : (
              <ArrowDownRight size={20} color={colors.error} />
            )}
          </View>
          <View style={styles.transactionContent}>
            <Text style={[styles.transactionTitle, { color: colors.foreground }]}>
              {transaction.description}
            </Text>
            <Text style={[styles.transactionMeta, { color: colors.mutedForeground }]}>
              {category?.name || 'Sem categoria'}
            </Text>
          </View>
          <Text
            style={[
              styles.transactionAmount,
              { color: isIncome ? colors.success : colors.error },
            ]}
          >
            {isIncome ? '+' : '-'}R$ {formatCurrency(transaction.amount)}
          </Text>
        </View>
      </Pressable>
    </View>
  )
}

interface DateGroupProps {
  date: string
  transactions: Transaction[]
  categories: TransactionCategory[]
  baseDelay: number
  onTransactionPress: (id: string) => void
  t: (key: string) => string
}

function DateGroup({
  date,
  transactions,
  categories,
  baseDelay,
  onTransactionPress,
  t,
}: DateGroupProps) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()

  const categoryMap = useMemo(() => {
    const map = new Map<string, TransactionCategory>()
    categories.forEach((cat) => map.set(cat.id, cat))
    return map
  }, [categories])

  return (
    <View style={styles.dateGroup}>
      <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>
        {formatDate(date, t)}
      </Text>
      {transactions.map((transaction, index) => (
        <TransactionItem
          key={transaction.id}
          transaction={transaction}
          category={categoryMap.get(transaction.categoryId)}
          delay={baseDelay + index * 50}
          onPress={() => onTransactionPress(transaction.id)}
        />
      ))}
    </View>
  )
}

function EmptyState() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.accent + '15' }]}>
        <Wallet size={48} color={colors.accent} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        {t('finances.noTransactions')}
      </Text>
      <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
        {t('finances.emptyDescription')}
      </Text>
      <Pressable
        style={[styles.emptyButton, { backgroundColor: colors.accent }]}
        onPress={() => router.push('/transaction/new' as any)}
      >
        <Plus size={20} color={colors.white} />
        <Text style={styles.emptyButtonText}>{t('finances.addTransaction')}</Text>
      </Pressable>
    </View>
  )
}

function LoadingState() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.errorState}>
      <View style={[styles.errorIconContainer, { backgroundColor: colors.error + '15' }]}>
        <AlertCircle size={48} color={colors.error} />
      </View>
      <Text style={[styles.errorTitle, { color: colors.foreground }]}>
        {t('finances.loadError')}
      </Text>
      <Pressable style={[styles.retryButton, { backgroundColor: colors.accent }]} onPress={onRetry}>
        <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
      </Pressable>
    </View>
  )
}

interface QuickActionProps {
  icon: React.ReactNode
  label: string
  iconBgColor: string
  delay: number
  onPress: () => void
}

function QuickAction({ icon, label, iconBgColor, delay, onPress }: QuickActionProps) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <View
     
      style={[styles.quickAction, { backgroundColor: colors.card }, cardShadow]}
    >
      <Pressable style={styles.quickActionPressable} onPress={onPress}>
        <View style={[styles.quickActionIcon, { backgroundColor: iconBgColor }]}>{icon}</View>
        <Text style={[styles.quickActionLabel, { color: colors.foreground }]}>{label}</Text>
      </Pressable>
    </View>
  )
}

export default function FinancesScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const [hideBalance, setHideBalance] = useState(false)
  const currentMonth = getCurrentMonth()

  const {
    data: transactions,
    isLoading: isLoadingTransactions,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useTransactionsQuery()

  const {
    data: categories,
    isLoading: isLoadingCategories,
    refetch: refetchCategories,
  } = useCategoriesQuery()

  const monthlyStats = useMonthlyStats(transactions, currentMonth)
  const groupedTransactions = useGroupedTransactions(transactions)

  const isLoading = isLoadingTransactions || isLoadingCategories
  const hasError = !!transactionsError

  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await Promise.all([refetchTransactions(), refetchCategories()])
    setIsRefreshing(false)
  }, [refetchTransactions, refetchCategories])

  const handleTransactionPress = useCallback(
    (id: string) => {
      router.push(`/transaction/${id}` as any)
    },
    [router]
  )

  const handleAddTransaction = useCallback(() => {
    router.push('/transaction/new' as any)
  }, [router])

  const balance = monthlyStats.balance
  const displayBalance = hideBalance ? '••••••' : `R$ ${formatCurrency(balance)}`
  const displayIncome = hideBalance ? '••••' : `R$ ${formatCurrency(monthlyStats.totalIncome)}`
  const displayExpense = hideBalance ? '••••' : `R$ ${formatCurrency(monthlyStats.totalExpenses)}`

  // Show only recent 5 transactions for home view
  const recentGroups = useMemo(() => {
    let count = 0
    const result: typeof groupedTransactions = []
    for (const group of groupedTransactions) {
      if (count >= 5) break
      const remaining = 5 - count
      const slicedTransactions = group.transactions.slice(0, remaining)
      result.push({ date: group.date, transactions: slicedTransactions })
      count += slicedTransactions.length
    }
    return result
  }, [groupedTransactions])

  if (isLoading && !transactions) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <LoadingState />
      </SafeAreaView>
    )
  }

  if (hasError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ErrorState onRetry={handleRefresh} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, spacing[8]) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {t('finances.title')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {t('finances.monthOverview')}
            </Text>
          </View>
          <Pressable
            style={[styles.iconButtonPrimary, { backgroundColor: colors.accent }]}
            onPress={handleAddTransaction}
          >
            <Plus size={22} color={colors.white} />
          </Pressable>
        </View>

        {/* Balance Card */}
        <View
         
          style={[styles.balanceCard, { backgroundColor: colors.card }, cardShadow]}
        >
          <View style={styles.balanceHeader}>
            <View style={styles.balanceHeaderLeft}>
              <Wallet size={18} color={colors.mutedForeground} />
              <Text style={[styles.balanceLabel, { color: colors.mutedForeground }]}>{t('finances.balance')}</Text>
            </View>
            <Pressable onPress={() => setHideBalance(!hideBalance)} hitSlop={8}>
              {hideBalance ? (
                <EyeOff size={20} color={colors.mutedForeground} />
              ) : (
                <Eye size={20} color={colors.mutedForeground} />
              )}
            </Pressable>
          </View>
          <Text style={[styles.balanceValue, { color: colors.foreground }]}>{displayBalance}</Text>

          <View style={styles.balanceStats}>
            <View style={[styles.balanceStatItem, { backgroundColor: colors.secondary }]}>
              <View style={styles.balanceStatHeader}>
                <TrendingUp size={14} color={colors.success} />
                <Text style={[styles.balanceStatLabel, { color: colors.mutedForeground }]}>{t('finances.income')}</Text>
              </View>
              <Text style={[styles.balanceStatValue, { color: colors.foreground }]}>{displayIncome}</Text>
            </View>
            <View style={[styles.balanceStatItem, { backgroundColor: colors.secondary }]}>
              <View style={styles.balanceStatHeader}>
                <TrendingDown size={14} color={colors.error} />
                <Text style={[styles.balanceStatLabel, { color: colors.mutedForeground }]}>{t('finances.expense')}</Text>
              </View>
              <Text style={[styles.balanceStatValue, { color: colors.foreground }]}>{displayExpense}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsGrid}>
          <View style={styles.quickActionsRow}>
            <QuickAction
              icon={<PieChart size={20} color={colors.accent} />}
              label={t('finances.categories')}
              iconBgColor={colors.accent + '20'}
              delay={150}
              onPress={() => router.push('/finances/categories' as any)}
            />
            <QuickAction
              icon={<Target size={20} color={colors.success} />}
              label={t('finances.goals')}
              iconBgColor={colors.success + '20'}
              delay={200}
              onPress={() => router.push('/finances/goals' as any)}
            />
          </View>
          <View style={styles.quickActionsRow}>
            <QuickAction
              icon={<CreditCard size={20} color={colors.info} />}
              label={t('finances.budgets')}
              iconBgColor={colors.info + '20'}
              delay={250}
              onPress={() => router.push('/finances/budgets' as any)}
            />
            <QuickAction
              icon={<BarChart3 size={20} color={colors.warning} />}
              label={t('finances.stats.analytics')}
              iconBgColor={colors.warning + '20'}
              delay={300}
              onPress={() => router.push('/finances/analytics' as any)}
            />
          </View>
        </View>

        {/* Recent Transactions Section */}
        <View
         
          style={styles.sectionHeader}
        >
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
            {t('finances.recentTransactions')}
          </Text>
          {transactions && transactions.length > 0 && (
            <Pressable onPress={() => router.push('/finances/transactions' as any)}>
              <Text style={[styles.sectionLink, { color: colors.accent }]}>
                {t('finances.viewAll')}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Transactions List or Empty State */}
        {!transactions || transactions.length === 0 ? (
          <EmptyState />
        ) : (
          <View style={styles.transactionsList}>
            {recentGroups.map((group, groupIndex) => (
              <DateGroup
                key={group.date}
                date={group.date}
                transactions={group.transactions}
                categories={categories || []}
                baseDelay={350 + groupIndex * 100}
                onTransactionPress={handleTransactionPress}
                t={t}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Loading & Error
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
  },
  errorIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[6],
  },
  errorTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
  retryButton: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
  },
  subtitle: {
    fontSize: typography.size.sm,
    marginTop: spacing[1],
  },
  iconButtonPrimary: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Balance Card
  balanceCard: {
    marginHorizontal: spacing[6],
    marginBottom: spacing[6],
    padding: spacing[6],
    borderRadius: radius['2xl'],
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  balanceHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  balanceLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  balanceValue: {
    fontSize: typography.size['4xl'],
    fontWeight: typography.weight.bold,
  },
  balanceStats: {
    flexDirection: 'row',
    gap: spacing[4],
    marginTop: spacing[5],
  },
  balanceStatItem: {
    flex: 1,
    padding: spacing[3],
    borderRadius: radius.lg,
  },
  balanceStatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    marginBottom: spacing[1],
  },
  balanceStatLabel: {
    fontSize: typography.size.xs,
  },
  balanceStatValue: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },

  // Quick Actions
  quickActionsGrid: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[6],
    gap: spacing[2.5],
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: spacing[2.5],
  },
  quickAction: {
    flex: 1,
    borderRadius: radius.lg,
  },
  quickActionPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    gap: spacing[2],
  },
  quickActionIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    flex: 1,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionLink: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },

  // Transactions List
  transactionsList: {
    paddingHorizontal: spacing[6],
    gap: spacing[4],
  },
  dateGroup: {
    gap: spacing[2.5],
  },
  dateLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing[1],
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3.5],
    borderRadius: radius.xl,
    gap: spacing[3.5],
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionContent: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: typography.size.base - 1,
    fontWeight: typography.weight.medium,
  },
  transactionMeta: {
    fontSize: typography.size.sm - 1,
    marginTop: spacing[0.5],
  },
  transactionAmount: {
    fontSize: typography.size.base - 1,
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
