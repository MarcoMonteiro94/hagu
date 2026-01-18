import { useState, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Plus,
  Search,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Wallet,
} from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useTheme, spacing, radius, typography, cardShadow } from '@/theme'
import {
  useTransactionsQuery,
  useCategoriesQuery,
  useGroupedTransactions,
  type Transaction,
  type TransactionCategory,
  type TransactionType,
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
    month: 'long',
  })
}

interface TransactionItemProps {
  transaction: Transaction
  category: TransactionCategory | undefined
  onPress: () => void
}

function TransactionItem({ transaction, category, onPress }: TransactionItemProps) {
  const { colors } = useTheme()
  const isIncome = transaction.type === 'income'

  return (
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
  )
}

type FilterType = 'all' | 'income' | 'expense'

function EmptyState() {
  const { t } = useTranslation()
  const { colors } = useTheme()

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
    </View>
  )
}

export default function TransactionsScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()

  const {
    data: transactions,
    isLoading,
    refetch,
  } = useTransactionsQuery()
  const { data: categories = [] } = useCategoriesQuery()

  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const categoryMap = useMemo(() => {
    const map = new Map<string, TransactionCategory>()
    categories.forEach((cat) => map.set(cat.id, cat))
    return map
  }, [categories])

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return []

    return transactions.filter((t) => {
      // Type filter
      if (filterType !== 'all' && t.type !== filterType) {
        return false
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const category = categoryMap.get(t.categoryId)
        const categoryName = category?.name?.toLowerCase() || ''
        const description = t.description.toLowerCase()

        return description.includes(query) || categoryName.includes(query)
      }

      return true
    })
  }, [transactions, filterType, searchQuery, categoryMap])

  // Group by date
  const groupedTransactions = useMemo(() => {
    const groups = new Map<string, Transaction[]>()

    filteredTransactions.forEach((t) => {
      const existing = groups.get(t.date) || []
      groups.set(t.date, [...existing, t])
    })

    return Array.from(groups.entries())
      .map(([date, items]) => ({ date, transactions: items }))
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [filteredTransactions])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await refetch()
    setIsRefreshing(false)
  }, [refetch])

  const handleTransactionPress = useCallback((id: string) => {
    router.push(`/transaction/${id}` as any)
  }, [])

  const handleAddTransaction = useCallback(() => {
    router.push('/transaction/new' as any)
  }, [])


  const renderItem = useCallback(
    ({ item }: { item: Transaction }) => (
      <TransactionItem
        transaction={item}
        category={categoryMap.get(item.categoryId)}
        onPress={() => handleTransactionPress(item.id)}
      />
    ),
    [categoryMap, handleTransactionPress]
  )

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
          {t('finances.recentTransactions')}
        </Text>
        <Pressable
          onPress={handleAddTransaction}
          style={[styles.addButton, { backgroundColor: colors.accent }]}
          hitSlop={8}
        >
          <Plus size={20} color={colors.white} />
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.secondary,
              borderColor: colors.border,
            },
          ]}
        >
          <Search size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('common.search')}
            placeholderTextColor={colors.mutedForeground}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <X size={18} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <Pressable
          onPress={() => setFilterType('all')}
          style={[
            styles.filterChip,
            {
              backgroundColor: filterType === 'all' ? colors.accent + '20' : colors.secondary,
              borderColor: filterType === 'all' ? colors.accent : colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.filterText,
              { color: filterType === 'all' ? colors.accent : colors.mutedForeground },
            ]}
          >
            {t('finances.filter.all')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setFilterType('income')}
          style={[
            styles.filterChip,
            {
              backgroundColor: filterType === 'income' ? colors.success + '20' : colors.secondary,
              borderColor: filterType === 'income' ? colors.success : colors.border,
            },
          ]}
        >
          <ArrowUpRight
            size={14}
            color={filterType === 'income' ? colors.success : colors.mutedForeground}
          />
          <Text
            style={[
              styles.filterText,
              { color: filterType === 'income' ? colors.success : colors.mutedForeground },
            ]}
          >
            {t('finances.income')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setFilterType('expense')}
          style={[
            styles.filterChip,
            {
              backgroundColor: filterType === 'expense' ? colors.error + '20' : colors.secondary,
              borderColor: filterType === 'expense' ? colors.error : colors.border,
            },
          ]}
        >
          <ArrowDownRight
            size={14}
            color={filterType === 'expense' ? colors.error : colors.mutedForeground}
          />
          <Text
            style={[
              styles.filterText,
              { color: filterType === 'expense' ? colors.error : colors.mutedForeground },
            ]}
          >
            {t('finances.expense')}
          </Text>
        </Pressable>
      </View>

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={groupedTransactions}
          keyExtractor={(item) => item.date}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.delay(index * 50).duration(300)}
              style={styles.dateGroup}
            >
              <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>
                {formatDate(item.date, t)}
              </Text>
              {item.transactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  category={categoryMap.get(transaction.categoryId)}
                  onPress={() => handleTransactionPress(transaction.id)}
                />
              ))}
            </Animated.View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
        />
      )}
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
  searchContainer: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.size.base,
    padding: 0,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[4],
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  filterText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  listContent: {
    padding: spacing[6],
    paddingTop: 0,
    gap: spacing[4],
  },
  dateGroup: {
    gap: spacing[2.5],
  },
  dateLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing[1],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
})
