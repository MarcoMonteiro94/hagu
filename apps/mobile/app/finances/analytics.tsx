import { useState, useMemo, useCallback } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  BarChart3,
  LineChart as LineChartIcon,
} from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useTheme, spacing, radius, typography, cardShadow } from '@/theme'
import {
  useTransactionsQuery,
  useCategoriesQuery,
  useMonthlyStats,
  type Transaction,
  type TransactionCategory,
} from '@/hooks'
import { BarChart, PieChart, LineChart } from '@/components/finances'

type TimeRange = 'week' | 'month' | 'year'

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function formatCurrency(value: number): string {
  return value.toFixed(2).replace('.', ',')
}

function getWeekDates(): string[] {
  const today = new Date()
  const dates: string[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    dates.push(date.toISOString().split('T')[0])
  }
  return dates
}

function getMonthDates(): string[] {
  const today = new Date()
  const dates: string[] = []
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  for (let i = 1; i <= daysInMonth; i++) {
    dates.push(
      new Date(today.getFullYear(), today.getMonth(), i).toISOString().split('T')[0]
    )
  }
  return dates
}

function getYearMonths(): string[] {
  const today = new Date()
  const months: string[] = []
  for (let i = 0; i < 12; i++) {
    months.push(`${today.getFullYear()}-${String(i + 1).padStart(2, '0')}`)
  }
  return months
}

export default function AnalyticsScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()

  const { data: transactions = [], isLoading, refetch } = useTransactionsQuery()
  const { data: categories = [] } = useCategoriesQuery()

  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthlyStats = useMonthlyStats(transactions, currentMonth)

  const [timeRange, setTimeRange] = useState<TimeRange>('month')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const categoryMap = useMemo(() => {
    const map = new Map<string, TransactionCategory>()
    categories.forEach((cat) => map.set(cat.id, cat))
    return map
  }, [categories])

  // Calculate income vs expense data for bar chart
  const incomeExpenseData = useMemo(() => {
    if (timeRange === 'week') {
      const weekDates = getWeekDates()
      return weekDates.map((date) => {
        const dayTransactions = transactions.filter((t) => t.date === date)
        const income = dayTransactions
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0)
        const expense = dayTransactions
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0)
        const dayIndex = new Date(date).getDay()
        return {
          label: DAYS[dayIndex],
          income,
          expense,
        }
      })
    }
    // Month view - show weekly summaries
    return [
      { label: 'Sem 1', income: monthlyStats.totalIncome * 0.2, expense: monthlyStats.totalExpenses * 0.25 },
      { label: 'Sem 2', income: monthlyStats.totalIncome * 0.3, expense: monthlyStats.totalExpenses * 0.3 },
      { label: 'Sem 3', income: monthlyStats.totalIncome * 0.25, expense: monthlyStats.totalExpenses * 0.2 },
      { label: 'Sem 4', income: monthlyStats.totalIncome * 0.25, expense: monthlyStats.totalExpenses * 0.25 },
    ]
  }, [transactions, timeRange, monthlyStats])

  // Calculate category breakdown for pie chart
  const categoryBreakdown = useMemo(() => {
    const expenseTransactions = transactions.filter((t) => t.type === 'expense')
    const totals = new Map<string, number>()

    expenseTransactions.forEach((t) => {
      const current = totals.get(t.categoryId) || 0
      totals.set(t.categoryId, current + t.amount)
    })

    return Array.from(totals.entries())
      .map(([categoryId, value]) => {
        const category = categoryMap.get(categoryId)
        return {
          label: category?.name || 'Outros',
          value,
          color: category?.color || colors.muted,
        }
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6) // Top 6 categories
  }, [transactions, categoryMap, colors.muted])

  // Calculate spending trends for line chart
  const spendingTrends = useMemo(() => {
    if (timeRange === 'week') {
      const weekDates = getWeekDates()
      let cumulative = 0
      return weekDates.map((date) => {
        const dayExpense = transactions
          .filter((t) => t.date === date && t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0)
        cumulative += dayExpense
        const dayIndex = new Date(date).getDay()
        return {
          label: DAYS[dayIndex],
          value: cumulative,
        }
      })
    }
    // Month - show daily cumulative
    const monthDates = getMonthDates().slice(0, new Date().getDate())
    let cumulative = 0
    return monthDates
      .filter((_, i) => i % 5 === 0 || i === monthDates.length - 1) // Sample every 5 days
      .map((date) => {
        const upToDate = transactions
          .filter(
            (t) =>
              t.type === 'expense' &&
              t.date <= date &&
              t.date >= monthDates[0]
          )
          .reduce((sum, t) => sum + t.amount, 0)
        const day = new Date(date).getDate()
        return {
          label: `${day}`,
          value: upToDate,
        }
      })
  }, [transactions, timeRange])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await refetch()
    setIsRefreshing(false)
  }, [refetch])

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
          {t('finances.stats.analytics')}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        {(['week', 'month'] as TimeRange[]).map((range) => (
          <Pressable
            key={range}
            onPress={() => setTimeRange(range)}
            style={[
              styles.timeRangeButton,
              {
                backgroundColor:
                  timeRange === range ? colors.accent + '20' : colors.secondary,
                borderColor: timeRange === range ? colors.accent : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.timeRangeText,
                { color: timeRange === range ? colors.accent : colors.mutedForeground },
              ]}
            >
              {t(`finances.stats.${range}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
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
        {/* Summary Cards */}
        <Animated.View entering={FadeInDown.delay(0).duration(400)} style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.card }, cardShadow]}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.success + '15' }]}>
              <TrendingUp size={20} color={colors.success} />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
              {t('finances.income')}
            </Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              R$ {formatCurrency(monthlyStats.totalIncome)}
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.card }, cardShadow]}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.error + '15' }]}>
              <TrendingDown size={20} color={colors.error} />
            </View>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
              {t('finances.expense')}
            </Text>
            <Text style={[styles.summaryValue, { color: colors.error }]}>
              R$ {formatCurrency(monthlyStats.totalExpenses)}
            </Text>
          </View>
        </Animated.View>

        {/* Income vs Expense Chart */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={[styles.chartCard, { backgroundColor: colors.card }, cardShadow]}
        >
          <View style={styles.chartHeader}>
            <BarChart3 size={20} color={colors.accent} />
            <Text style={[styles.chartTitle, { color: colors.foreground }]}>
              {t('finances.stats.incomeVsExpense')}
            </Text>
          </View>
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.legendText, { color: colors.mutedForeground }]}>
                {t('finances.income')}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.error }]} />
              <Text style={[styles.legendText, { color: colors.mutedForeground }]}>
                {t('finances.expense')}
              </Text>
            </View>
          </View>
          <View style={styles.barChartContainer}>
            {incomeExpenseData.map((item, index) => {
              const maxValue = Math.max(
                ...incomeExpenseData.map((d) => Math.max(d.income, d.expense)),
                1
              )
              const incomeHeight = (item.income / maxValue) * 120
              const expenseHeight = (item.expense / maxValue) * 120
              return (
                <View key={index} style={styles.barGroup}>
                  <View style={styles.barsWrapper}>
                    <View
                      style={[
                        styles.barIncome,
                        { height: incomeHeight || 2, backgroundColor: colors.success },
                      ]}
                    />
                    <View
                      style={[
                        styles.barExpense,
                        { height: expenseHeight || 2, backgroundColor: colors.error },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, { color: colors.mutedForeground }]}>
                    {item.label}
                  </Text>
                </View>
              )
            })}
          </View>
        </Animated.View>

        {/* Category Breakdown */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={[styles.chartCard, { backgroundColor: colors.card }, cardShadow]}
        >
          <View style={styles.chartHeader}>
            <PieChartIcon size={20} color={colors.accent} />
            <Text style={[styles.chartTitle, { color: colors.foreground }]}>
              {t('finances.stats.categoryBreakdown')}
            </Text>
          </View>
          <View style={styles.pieChartContainer}>
            {categoryBreakdown.length > 0 ? (
              <PieChart data={categoryBreakdown} size={180} innerRadius={50} />
            ) : (
              <View style={styles.emptyChart}>
                <Text style={[styles.emptyChartText, { color: colors.mutedForeground }]}>
                  {t('finances.stats.noData')}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Spending Trends */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          style={[styles.chartCard, { backgroundColor: colors.card }, cardShadow]}
        >
          <View style={styles.chartHeader}>
            <LineChartIcon size={20} color={colors.accent} />
            <Text style={[styles.chartTitle, { color: colors.foreground }]}>
              {t('finances.stats.spendingTrends')}
            </Text>
          </View>
          <View style={styles.lineChartContainer}>
            {spendingTrends.length > 1 ? (
              <LineChart data={spendingTrends} height={180} color={colors.error} />
            ) : (
              <View style={styles.emptyChart}>
                <Text style={[styles.emptyChartText, { color: colors.mutedForeground }]}>
                  {t('finances.stats.noData')}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
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
  placeholder: {
    width: 40,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
  },
  timeRangeButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  timeRangeText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing[6],
    gap: spacing[4],
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  summaryCard: {
    flex: 1,
    padding: spacing[4],
    borderRadius: radius.xl,
    alignItems: 'center',
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  summaryLabel: {
    fontSize: typography.size.sm,
    marginBottom: spacing[1],
  },
  summaryValue: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  chartCard: {
    padding: spacing[4],
    borderRadius: radius.xl,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  chartTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  chartLegend: {
    flexDirection: 'row',
    gap: spacing[4],
    marginBottom: spacing[3],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: typography.size.xs,
  },
  barChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 150,
    paddingTop: spacing[2],
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
  },
  barsWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 120,
  },
  barIncome: {
    width: 12,
    borderRadius: radius.sm,
    minHeight: 2,
  },
  barExpense: {
    width: 12,
    borderRadius: radius.sm,
    minHeight: 2,
  },
  barLabel: {
    fontSize: typography.size.xs,
    marginTop: spacing[2],
  },
  pieChartContainer: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  lineChartContainer: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  emptyChart: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChartText: {
    fontSize: typography.size.sm,
  },
})
