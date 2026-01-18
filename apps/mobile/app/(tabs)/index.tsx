import { useState, useMemo } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { Link } from 'expo-router'
import {
  CheckCircle2,
  Circle,
  Plus,
  ChevronRight,
  Flame,
  Star,
  CheckSquare,
  Target,
  Wallet,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  FolderKanban,
} from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useAuth } from '@/lib/auth'
import { useTheme, cardShadow, spacing, radius, typography } from '@/theme'
import { useHomeWidgets } from '@/hooks/use-settings'
import {
  useHabitsQuery,
  useTasksQuery,
  useTaskStats,
  useTransactionsQuery,
  useMonthlyStats,
  useProjectsWithProgressQuery,
  useUserStats,
  useGlobalStreak,
  useLevel,
} from '@/hooks'

function formatDate(locale: string): string {
  return new Date().toLocaleDateString(locale === 'pt-BR' ? 'pt-BR' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function formatCurrency(value: number, currency = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value)
}

const HIDDEN_VALUE = '••••••'

function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0]
}

export default function HomeScreen() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { colors } = useTheme()
  const { widgets } = useHomeWidgets()
  const [hideBalances, setHideBalances] = useState(false)

  // Real data hooks
  const { data: habits, isLoading: habitsLoading, refetch: refetchHabits } = useHabitsQuery()
  const { data: tasks, isLoading: tasksLoading, refetch: refetchTasks } = useTasksQuery()
  const taskStats = useTaskStats(tasks)
  const { data: transactions, isLoading: transactionsLoading, refetch: refetchTransactions } = useTransactionsQuery()
  const monthlyStats = useMonthlyStats(transactions, getCurrentMonth())
  const { data: projects, isLoading: projectsLoading, refetch: refetchProjects } = useProjectsWithProgressQuery()
  const { data: userStats } = useUserStats()
  const streakData = useGlobalStreak()
  const level = useLevel()

  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([
      refetchHabits(),
      refetchTasks(),
      refetchTransactions(),
      refetchProjects(),
    ])
    setIsRefreshing(false)
  }

  const userName = user?.email?.split('@')[0] || 'visitante'
  const locale = i18n.language || 'pt-BR'
  const today = getTodayDateString()

  // Computed stats from real data
  const activeHabits = useMemo(() =>
    (habits || []).filter(h => !h.archivedAt),
    [habits]
  )

  const completedHabitsToday = useMemo(() =>
    activeHabits.filter(h =>
      h.completions?.some(c => c.date === today)
    ).length,
    [activeHabits, today]
  )

  const totalHabitsToday = activeHabits.length
  const habitProgress = totalHabitsToday > 0
    ? Math.round((completedHabitsToday / totalHabitsToday) * 100)
    : 0

  const pendingTasks = taskStats.pending + taskStats.inProgress
  const streak = streakData.currentStreak

  // Limit items for home widgets
  const displayHabits = activeHabits.slice(0, 5)
  const displayTasks = (tasks || []).filter(t => t.status !== 'done').slice(0, 5)
  const displayProjects = (projects || []).filter(p => p.status === 'active').slice(0, 3)

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Header - Date + Quick Stats */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.header}>
          <View>
            <Text style={[styles.date, { color: colors.foreground }]}>
              {formatDate(locale)}
            </Text>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
              {getGreeting()}, {userName}
            </Text>
          </View>
        </Animated.View>

        {/* Quick Stats Bar (like web) */}
        {widgets.quickStats && (
          <Animated.View
            entering={FadeInDown.delay(100).duration(400)}
            style={styles.statsBar}
          >
            <View style={styles.statItem}>
              <Flame size={18} color={colors.warning} />
              <Text style={[styles.statText, { color: colors.foreground }]}>
                {streak} dias
              </Text>
            </View>
            <View style={styles.statItem}>
              <Star size={18} color="#eab308" />
              <Text style={[styles.statText, { color: colors.foreground }]}>
                Nível {level}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Habits Widget (like web) */}
        {widgets.habits && (
          <Animated.View
            entering={FadeInDown.delay(150).duration(400)}
            style={styles.widgetContainer}
          >
            <View style={[styles.widget, { backgroundColor: colors.card }, cardShadow]}>
              {/* Header */}
              <View style={styles.widgetHeader}>
                <View style={styles.widgetTitleRow}>
                  <Target size={18} color={colors.accent} />
                  <Text style={[styles.widgetTitle, { color: colors.foreground }]}>
                    Hábitos
                  </Text>
                </View>
                <View style={styles.widgetHeaderRight}>
                  <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>
                      {completedHabitsToday}/{totalHabitsToday}
                    </Text>
                  </View>
                  <Pressable style={styles.addButton}>
                    <Plus size={18} color={colors.mutedForeground} />
                  </Pressable>
                </View>
              </View>

              {/* Progress bar */}
              {totalHabitsToday > 0 && (
                <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { backgroundColor: colors.accent, width: `${habitProgress}%` },
                    ]}
                  />
                </View>
              )}

              {/* Habit list */}
              <View style={styles.widgetContent}>
                {displayHabits.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                    Nenhum hábito cadastrado
                  </Text>
                ) : (
                  displayHabits.map((habit) => {
                    const completedToday = habit.completions?.some(c => c.date === today)
                    return (
                      <Pressable
                        key={habit.id}
                        style={[
                          styles.habitItem,
                          {
                            borderLeftColor: habit.color || colors.accent,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        {completedToday ? (
                          <CheckCircle2 size={20} color={colors.success} />
                        ) : (
                          <Circle size={20} color={colors.mutedForeground} />
                        )}
                        <Text
                          style={[
                            styles.habitTitle,
                            { color: colors.foreground },
                            completedToday && styles.habitTitleCompleted,
                          ]}
                        >
                          {habit.title}
                        </Text>
                      </Pressable>
                    )
                  })
                )}
              </View>

              {/* View all link */}
              <Link href="/(tabs)/habits" asChild>
                <Pressable style={styles.viewAllButton}>
                  <Text style={[styles.viewAllText, { color: colors.mutedForeground }]}>
                    Ver todos
                  </Text>
                  <ChevronRight size={16} color={colors.mutedForeground} />
                </Pressable>
              </Link>
            </View>
          </Animated.View>
        )}

        {/* Tasks Widget (like web) */}
        {widgets.tasks && (
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={styles.widgetContainer}
          >
            <View style={[styles.widget, { backgroundColor: colors.card }, cardShadow]}>
              {/* Header */}
              <View style={styles.widgetHeader}>
                <View style={styles.widgetTitleRow}>
                  <CheckSquare size={18} color={colors.accent} />
                  <Text style={[styles.widgetTitle, { color: colors.foreground }]}>
                    Tarefas
                  </Text>
                </View>
                <View style={styles.widgetHeaderRight}>
                  <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>
                      {pendingTasks} pendentes
                    </Text>
                  </View>
                  <Pressable style={styles.addButton}>
                    <Plus size={18} color={colors.mutedForeground} />
                  </Pressable>
                </View>
              </View>

              {/* Task list */}
              <View style={styles.widgetContent}>
                {displayTasks.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                    Nenhuma tarefa pendente
                  </Text>
                ) : (
                  displayTasks.map((task) => {
                    const priorityColors: Record<string, string> = {
                      low: colors.success,
                      medium: '#eab308',
                      high: colors.warning,
                      urgent: colors.error,
                    }
                    const isDone = task.status === 'done'

                    return (
                      <Pressable
                        key={task.id}
                        style={[styles.taskItem, { borderColor: colors.border }]}
                      >
                        {isDone ? (
                          <CheckCircle2 size={20} color={colors.success} />
                        ) : (
                          <Circle size={20} color={colors.mutedForeground} />
                        )}
                        <Text
                          style={[
                            styles.taskTitle,
                            { color: colors.foreground },
                            isDone && styles.taskTitleCompleted,
                          ]}
                          numberOfLines={1}
                        >
                          {task.title}
                        </Text>
                        {task.priority && (
                          <View
                            style={[
                              styles.priorityDot,
                              { backgroundColor: priorityColors[task.priority] || colors.mutedForeground },
                            ]}
                          />
                        )}
                      </Pressable>
                    )
                  })
                )}
              </View>

              {/* View all link */}
              <Link href="/(tabs)/tasks" asChild>
                <Pressable style={styles.viewAllButton}>
                  <Text style={[styles.viewAllText, { color: colors.mutedForeground }]}>
                    Ver todos
                  </Text>
                  <ChevronRight size={16} color={colors.mutedForeground} />
                </Pressable>
              </Link>
            </View>
          </Animated.View>
        )}

        {/* Finances Widget (like web) */}
        {widgets.finances && (
          <Animated.View
            entering={FadeInDown.delay(250).duration(400)}
            style={styles.widgetContainer}
          >
            <View style={[styles.widget, { backgroundColor: colors.card }, cardShadow]}>
              {/* Header */}
              <View style={styles.widgetHeader}>
                <View style={styles.widgetTitleRow}>
                  <Wallet size={18} color={colors.accent} />
                  <Text style={[styles.widgetTitle, { color: colors.foreground }]}>
                    Finanças
                  </Text>
                </View>
                <View style={styles.widgetHeaderRight}>
                  <Pressable
                    style={styles.addButton}
                    onPress={() => setHideBalances(!hideBalances)}
                  >
                    {hideBalances ? (
                      <EyeOff size={18} color={colors.mutedForeground} />
                    ) : (
                      <Eye size={18} color={colors.mutedForeground} />
                    )}
                  </Pressable>
                </View>
              </View>

              {/* Total Balance */}
              <View style={[styles.financeBalanceCard, { backgroundColor: colors.muted }]}>
                <Text style={[styles.financeLabel, { color: colors.mutedForeground }]}>
                  Saldo Total
                </Text>
                <Text
                  style={[
                    styles.financeValue,
                    {
                      color: hideBalances
                        ? colors.mutedForeground
                        : monthlyStats.balance >= 0
                        ? colors.success
                        : colors.error,
                    },
                  ]}
                >
                  {hideBalances ? HIDDEN_VALUE : formatCurrency(monthlyStats.balance)}
                </Text>
              </View>

              {/* Income/Expenses Row */}
              <View style={styles.financeRow}>
                <View style={[styles.financeCard, { borderColor: colors.border }]}>
                  <View style={styles.financeCardHeader}>
                    <TrendingUp size={12} color={colors.success} />
                    <Text style={[styles.financeCardLabel, { color: colors.mutedForeground }]}>
                      Receitas
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.financeCardValue,
                      { color: hideBalances ? colors.mutedForeground : colors.success },
                    ]}
                  >
                    {hideBalances ? HIDDEN_VALUE : formatCurrency(monthlyStats.totalIncome)}
                  </Text>
                </View>
                <View style={[styles.financeCard, { borderColor: colors.border }]}>
                  <View style={styles.financeCardHeader}>
                    <TrendingDown size={12} color={colors.error} />
                    <Text style={[styles.financeCardLabel, { color: colors.mutedForeground }]}>
                      Despesas
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.financeCardValue,
                      { color: hideBalances ? colors.mutedForeground : colors.error },
                    ]}
                  >
                    {hideBalances ? HIDDEN_VALUE : formatCurrency(monthlyStats.totalExpenses)}
                  </Text>
                </View>
              </View>

              {/* View all link */}
              <Link href="/(tabs)/finances" asChild>
                <Pressable style={styles.viewAllButton}>
                  <Text style={[styles.viewAllText, { color: colors.mutedForeground }]}>
                    Ver detalhes
                  </Text>
                  <ChevronRight size={16} color={colors.mutedForeground} />
                </Pressable>
              </Link>
            </View>
          </Animated.View>
        )}

        {/* Projects Widget (like web) */}
        {widgets.projects && (
          <Animated.View
            entering={FadeInDown.delay(300).duration(400)}
            style={styles.widgetContainer}
          >
            <View style={[styles.widget, { backgroundColor: colors.card }, cardShadow]}>
              {/* Header */}
              <View style={styles.widgetHeader}>
                <View style={styles.widgetTitleRow}>
                  <FolderKanban size={18} color={colors.accent} />
                  <Text style={[styles.widgetTitle, { color: colors.foreground }]}>
                    Projetos
                  </Text>
                </View>
                <View style={styles.widgetHeaderRight}>
                  <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>
                      {displayProjects.length} ativos
                    </Text>
                  </View>
                  <Pressable style={styles.addButton}>
                    <Plus size={18} color={colors.mutedForeground} />
                  </Pressable>
                </View>
              </View>

              {/* Project list */}
              <View style={styles.widgetContent}>
                {displayProjects.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                    Nenhum projeto ativo
                  </Text>
                ) : (
                  displayProjects.map((project) => (
                    <View
                      key={project.id}
                      style={[styles.projectItem, { borderColor: colors.border }]}
                    >
                      <View
                        style={[styles.projectDot, { backgroundColor: project.color || colors.accent }]}
                      />
                      <Text
                        style={[styles.projectName, { color: colors.foreground }]}
                        numberOfLines={1}
                      >
                        {project.title}
                      </Text>
                      <View style={[styles.projectProgressBg, { backgroundColor: colors.muted }]}>
                        <View
                          style={[
                            styles.projectProgressFill,
                            { backgroundColor: project.color || colors.accent, width: `${project.progress || 0}%` },
                          ]}
                        />
                      </View>
                      <Text style={[styles.projectPercent, { color: colors.mutedForeground }]}>
                        {project.progress || 0}%
                      </Text>
                    </View>
                  ))
                )}
              </View>

              {/* View all link */}
              <Link href="/(tabs)/projects" asChild>
                <Pressable style={styles.viewAllButton}>
                  <Text style={[styles.viewAllText, { color: colors.mutedForeground }]}>
                    Ver todos
                  </Text>
                  <ChevronRight size={16} color={colors.mutedForeground} />
                </Pressable>
              </Link>
            </View>
          </Animated.View>
        )}

        {/* All done message (like web) */}
        {completedHabitsToday === totalHabitsToday &&
          totalHabitsToday > 0 &&
          pendingTasks === 0 && (
            <Animated.View
              entering={FadeInDown.delay(250).duration(400)}
              style={[styles.allDoneCard, { backgroundColor: `${colors.success}15` }]}
            >
              <CheckCircle2 size={32} color={colors.success} />
              <Text style={[styles.allDoneText, { color: colors.success }]}>
                Tudo concluído por hoje! 🎉
              </Text>
            </Animated.View>
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
    paddingBottom: spacing[8],
  },

  // Header
  header: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  date: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    textTransform: 'capitalize',
  },
  greeting: {
    fontSize: typography.size.sm,
    marginTop: spacing[1],
  },

  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  statText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },

  // Widget Container
  widgetContainer: {
    paddingHorizontal: spacing[6],
    marginBottom: spacing[4],
  },

  // Widget
  widget: {
    borderRadius: radius['2xl'],
    padding: spacing[4],
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  widgetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  widgetTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
  widgetHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  badge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius.md,
  },
  badgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Progress Bar
  progressBar: {
    height: 6,
    borderRadius: radius.full,
    marginBottom: spacing[3],
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },

  // Widget Content
  widgetContent: {
    gap: spacing[2],
  },
  emptyText: {
    fontSize: typography.size.sm,
    textAlign: 'center',
    paddingVertical: spacing[4],
  },

  // Habit Item
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  habitTitle: {
    fontSize: typography.size.base,
    flex: 1,
  },
  habitTitleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },

  // Task Item
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  taskTitle: {
    fontSize: typography.size.base,
    flex: 1,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // View All
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing[3],
    gap: spacing[1],
  },
  viewAllText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },

  // All Done
  allDoneCard: {
    marginHorizontal: spacing[6],
    padding: spacing[4],
    borderRadius: radius['2xl'],
    alignItems: 'center',
    gap: spacing[2],
  },
  allDoneText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
  },

  // Finance Widget
  financeBalanceCard: {
    padding: spacing[3],
    borderRadius: radius.lg,
    marginBottom: spacing[3],
  },
  financeLabel: {
    fontSize: typography.size.xs,
  },
  financeValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
  },
  financeRow: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  financeCard: {
    flex: 1,
    padding: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  financeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginBottom: spacing[1],
  },
  financeCardLabel: {
    fontSize: typography.size.xs,
  },
  financeCardValue: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },

  // Project Widget
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  projectDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  projectName: {
    fontSize: typography.size.base,
    flex: 1,
  },
  projectProgressBg: {
    width: 60,
    height: 6,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  projectProgressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  projectPercent: {
    fontSize: typography.size.xs,
    width: 32,
    textAlign: 'right',
  },
})
