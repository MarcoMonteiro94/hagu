import { useMemo } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { Stack } from 'expo-router'
import {
  Brain,
  Coffee,
  Calendar,
  Clock,
  TrendingUp,
  Zap,
  Timer,
  Target,
} from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useTheme, cardShadow, spacing, radius, typography } from '@/theme'
import { usePomodoroSessions, usePomodoroStats, TimerMode, PomodoroSession } from '@/hooks/use-pomodoro'

// =============================================================================
// Helpers
// =============================================================================

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function groupSessionsByDate(sessions: PomodoroSession[]): Map<string, PomodoroSession[]> {
  const grouped = new Map<string, PomodoroSession[]>()

  // Sort sessions by date descending
  const sorted = [...sessions].sort((a, b) =>
    new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  )

  for (const session of sorted) {
    const existing = grouped.get(session.date)
    if (existing) {
      existing.push(session)
    } else {
      grouped.set(session.date, [session])
    }
  }

  return grouped
}

// =============================================================================
// Constants
// =============================================================================

const MODE_COLORS: Record<TimerMode, string> = {
  work: '#8b5cf6',
  shortBreak: '#22c55e',
  longBreak: '#3b82f6',
}

// =============================================================================
// Components
// =============================================================================

interface SessionItemProps {
  session: PomodoroSession
}

function SessionItem({ session }: SessionItemProps) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const modeColor = MODE_COLORS[session.mode]

  const modeLabel = session.mode === 'work'
    ? t('pomodoro.modes.work')
    : session.mode === 'shortBreak'
    ? t('pomodoro.modes.shortBreak')
    : t('pomodoro.modes.longBreak')

  const ModeIcon = session.mode === 'work' ? Brain : Coffee

  return (
    <View style={[styles.sessionItem, { borderLeftColor: modeColor }]}>
      <View style={[styles.sessionIcon, { backgroundColor: modeColor + '15' }]}>
        <ModeIcon size={18} color={modeColor} />
      </View>
      <View style={styles.sessionContent}>
        <View style={styles.sessionHeader}>
          <Text style={[styles.sessionMode, { color: colors.foreground }]}>
            {modeLabel}
          </Text>
          <Text style={[styles.sessionTime, { color: colors.mutedForeground }]}>
            {formatTime(session.completedAt)}
          </Text>
        </View>
        {session.taskTitle && (
          <View style={styles.sessionTask}>
            <Target size={12} color={colors.mutedForeground} />
            <Text
              style={[styles.sessionTaskText, { color: colors.mutedForeground }]}
              numberOfLines={1}
            >
              {session.taskTitle}
            </Text>
          </View>
        )}
        <View style={styles.sessionDuration}>
          <Timer size={12} color={modeColor} />
          <Text style={[styles.sessionDurationText, { color: modeColor }]}>
            {session.duration} {t('pomodoro.settings.minutes')}
          </Text>
        </View>
      </View>
    </View>
  )
}

interface DayGroupProps {
  date: string
  sessions: PomodoroSession[]
  delay: number
}

function DayGroup({ date, sessions, delay }: DayGroupProps) {
  const { t } = useTranslation()
  const { colors } = useTheme()

  const workSessions = sessions.filter(s => s.mode === 'work')
  const totalMinutes = workSessions.reduce((sum, s) => sum + s.duration, 0)

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  let dateLabel: string
  if (date === today) {
    dateLabel = t('pomodoro.history.today')
  } else if (date === yesterday) {
    dateLabel = t('pomodoro.history.yesterday')
  } else {
    dateLabel = formatDate(date)
  }

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400)} style={styles.dayGroup}>
      <View style={styles.dayHeader}>
        <View style={styles.dayHeaderLeft}>
          <Calendar size={16} color={colors.mutedForeground} />
          <Text style={[styles.dayTitle, { color: colors.foreground }]}>{dateLabel}</Text>
        </View>
        <View style={styles.daySummary}>
          <Text style={[styles.daySummaryText, { color: colors.mutedForeground }]}>
            {workSessions.length} {t('pomodoro.stats.sessions').toLowerCase()} · {totalMinutes} {t('pomodoro.settings.minutes').toLowerCase()}
          </Text>
        </View>
      </View>

      <View style={[styles.sessionsCard, { backgroundColor: colors.card }, cardShadow]}>
        {sessions.map((session, index) => (
          <View key={session.id}>
            {index > 0 && <View style={[styles.sessionDivider, { backgroundColor: colors.border }]} />}
            <SessionItem session={session} />
          </View>
        ))}
      </View>
    </Animated.View>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  color?: string
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const { colors } = useTheme()

  return (
    <View style={[styles.statCard, { backgroundColor: colors.card }, cardShadow]}>
      <View style={[styles.statCardIcon, { backgroundColor: (color || colors.accent) + '15' }]}>
        {icon}
      </View>
      <Text style={[styles.statCardValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statCardLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export default function PomodoroHistoryScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()

  const { sessions, isLoading, refetch } = usePomodoroSessions()
  const stats = usePomodoroStats()

  const groupedSessions = useMemo(() => groupSessionsByDate(sessions), [sessions])
  const dateGroups = useMemo(() => Array.from(groupedSessions.entries()), [groupedSessions])

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen
        options={{
          title: t('pomodoro.history.title'),
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.accent}
          />
        }
      >
        {/* Summary Stats */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t('pomodoro.history.summary')}
          </Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon={<Zap size={20} color="#22c55e" />}
              label={t('pomodoro.history.totalSessions')}
              value={stats.totalSessions}
              color="#22c55e"
            />
            <StatCard
              icon={<TrendingUp size={20} color="#f97316" />}
              label={t('pomodoro.stats.streak')}
              value={stats.streak}
              color="#f97316"
            />
            <StatCard
              icon={<Timer size={20} color="#8b5cf6" />}
              label={t('pomodoro.history.thisWeekSessions')}
              value={stats.week.workSessions}
              color="#8b5cf6"
            />
            <StatCard
              icon={<Clock size={20} color="#3b82f6" />}
              label={t('pomodoro.history.thisWeekMinutes')}
              value={stats.week.totalMinutes}
              color="#3b82f6"
            />
          </View>
        </Animated.View>

        {/* Session History */}
        <View style={styles.historySection}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {t('pomodoro.history.recentSessions')}
          </Text>

          {dateGroups.length === 0 ? (
            <Animated.View
              entering={FadeInDown.delay(100).duration(400)}
              style={[styles.emptyState, { backgroundColor: colors.card }, cardShadow]}
            >
              <Timer size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {t('pomodoro.history.noSessions')}
              </Text>
              <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
                {t('pomodoro.history.noSessionsDesc')}
              </Text>
            </Animated.View>
          ) : (
            dateGroups.map(([date, daySessions], index) => (
              <DayGroup
                key={date}
                date={date}
                sessions={daySessions}
                delay={100 + index * 50}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
  },

  // Section Title
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing[3],
  },

  // Stats Section
  statsSection: {
    marginTop: spacing[4],
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  statCard: {
    width: '47%',
    padding: spacing[4],
    borderRadius: radius.xl,
    gap: spacing[2],
  },
  statCardIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCardValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
  },
  statCardLabel: {
    fontSize: typography.size.xs,
  },

  // History Section
  historySection: {
    marginTop: spacing[6],
  },

  // Day Group
  dayGroup: {
    marginBottom: spacing[4],
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  dayHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  dayTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  daySummary: {},
  daySummaryText: {
    fontSize: typography.size.xs,
  },

  // Sessions Card
  sessionsCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  sessionDivider: {
    height: 1,
    marginLeft: spacing[16],
  },

  // Session Item
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing[4],
    borderLeftWidth: 3,
  },
  sessionIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionContent: {
    flex: 1,
    marginLeft: spacing[3],
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionMode: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  sessionTime: {
    fontSize: typography.size.xs,
  },
  sessionTask: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[1],
  },
  sessionTaskText: {
    fontSize: typography.size.xs,
    flex: 1,
  },
  sessionDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[1.5],
  },
  sessionDurationText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
    borderRadius: radius.xl,
    gap: spacing[3],
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: typography.size.sm,
    textAlign: 'center',
  },
})
