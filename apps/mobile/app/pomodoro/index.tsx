import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { Stack, useRouter } from 'expo-router'
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Coffee,
  Brain,
  Settings2,
  Zap,
  Timer,
  Target,
  TrendingUp,
  Calendar,
  Link2,
  Link2Off,
  ChevronRight,
} from 'lucide-react-native'
import Svg, { Circle } from 'react-native-svg'
import { useTheme, cardShadow, spacing, radius, typography } from '@/theme'
import {
  usePomodoroTimer,
  usePomodoroSettings,
  usePomodoroStats,
  TimerMode,
} from '@/hooks/use-pomodoro'
import { useTasksQuery } from '@/hooks'

// =============================================================================
// Constants
// =============================================================================

const CIRCLE_SIZE = 280
const STROKE_WIDTH = 12
const CIRCLE_RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS

const MODE_COLORS: Record<TimerMode, string> = {
  work: '#8b5cf6',      // Violet for focus
  shortBreak: '#22c55e', // Green for short break
  longBreak: '#3b82f6',  // Blue for long break
}

// =============================================================================
// Components
// =============================================================================

interface ModeTabProps {
  mode: TimerMode
  currentMode: TimerMode
  label: string
  onPress: () => void
}

function ModeTab({ mode, currentMode, label, onPress }: ModeTabProps) {
  const { colors } = useTheme()
  const isActive = mode === currentMode
  const modeColor = MODE_COLORS[mode]

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.modeTab,
        {
          backgroundColor: isActive ? modeColor + '20' : 'transparent',
          borderColor: isActive ? modeColor : colors.border,
        },
      ]}
    >
      {mode === 'work' ? (
        <Brain size={16} color={isActive ? modeColor : colors.mutedForeground} />
      ) : (
        <Coffee size={16} color={isActive ? modeColor : colors.mutedForeground} />
      )}
      <Text
        style={[
          styles.modeTabText,
          { color: isActive ? modeColor : colors.mutedForeground },
        ]}
      >
        {label}
      </Text>
    </Pressable>
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

interface TaskSelectorModalProps {
  visible: boolean
  onClose: () => void
  onSelect: (task: { id: string; title: string } | null) => void
}

function TaskSelectorModal({ visible, onClose, onSelect }: TaskSelectorModalProps) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const { data: tasks } = useTasksQuery()

  const pendingTasks = tasks?.filter(t => t.status !== 'done') || []

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            {t('pomodoro.selectTask')}
          </Text>

          <ScrollView style={styles.taskList}>
            <Pressable
              style={[styles.taskItem, { borderColor: colors.border }]}
              onPress={() => {
                onSelect(null)
                onClose()
              }}
            >
              <Link2Off size={20} color={colors.mutedForeground} />
              <Text style={[styles.taskItemText, { color: colors.mutedForeground }]}>
                {t('pomodoro.noTask')}
              </Text>
            </Pressable>

            {pendingTasks.map(task => (
              <Pressable
                key={task.id}
                style={[styles.taskItem, { borderColor: colors.border }]}
                onPress={() => {
                  onSelect({ id: task.id, title: task.title })
                  onClose()
                }}
              >
                <Target size={20} color={colors.accent} />
                <Text
                  style={[styles.taskItemText, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {task.title}
                </Text>
                <ChevronRight size={18} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </ScrollView>

          <Pressable
            style={[styles.modalCloseButton, { backgroundColor: colors.muted }]}
            onPress={onClose}
          >
            <Text style={[styles.modalCloseText, { color: colors.foreground }]}>
              {t('common.cancel')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

// =============================================================================
// Main Component
// =============================================================================

export default function PomodoroScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const router = useRouter()

  const {
    mode,
    state,
    timeRemaining,
    totalTime,
    progress,
    formattedTime,
    sessionsCompleted,
    linkedTask,
    start,
    pause,
    reset,
    skip,
    changeMode,
    linkTask,
  } = usePomodoroTimer()

  const { settings } = usePomodoroSettings()
  const stats = usePomodoroStats()

  const [showTaskSelector, setShowTaskSelector] = useState(false)

  const modeColor = MODE_COLORS[mode]

  // Calculate progress
  const strokeDashoffset = CIRCLE_CIRCUMFERENCE * (1 - progress)

  const handlePlayPause = () => {
    if (state === 'running') {
      pause()
    } else {
      start()
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen
        options={{
          title: t('pomodoro.title'),
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerShadowVisible: false,
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/pomodoro/settings')}
              hitSlop={8}
              style={styles.headerButton}
            >
              <Settings2 size={22} color={colors.foreground} />
            </Pressable>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Mode Tabs */}
        <View style={styles.modeTabs}>
          <ModeTab
            mode="work"
            currentMode={mode}
            label={t('pomodoro.modes.work')}
            onPress={() => changeMode('work')}
          />
          <ModeTab
            mode="shortBreak"
            currentMode={mode}
            label={t('pomodoro.modes.shortBreak')}
            onPress={() => changeMode('shortBreak')}
          />
          <ModeTab
            mode="longBreak"
            currentMode={mode}
            label={t('pomodoro.modes.longBreak')}
            onPress={() => changeMode('longBreak')}
          />
        </View>

        {/* Timer Circle */}
        <View
         
          style={styles.timerContainer}
        >
          <View style={styles.timerCircle}>
            <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={styles.timerSvg}>
              {/* Background circle */}
              <Circle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={CIRCLE_RADIUS}
                stroke={colors.border}
                strokeWidth={STROKE_WIDTH}
                fill="transparent"
              />
              {/* Progress circle */}
              <Circle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={CIRCLE_RADIUS}
                stroke={modeColor}
                strokeWidth={STROKE_WIDTH}
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={CIRCLE_CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
              />
            </Svg>

            {/* Timer display */}
            <View style={styles.timerDisplay}>
              <Text style={[styles.timerText, { color: colors.foreground }]}>
                {formattedTime}
              </Text>
              <Text style={[styles.timerMode, { color: modeColor }]}>
                {mode === 'work'
                  ? t('pomodoro.modes.work')
                  : mode === 'shortBreak'
                  ? t('pomodoro.modes.shortBreak')
                  : t('pomodoro.modes.longBreak')}
              </Text>
              {mode === 'work' && (
                <Text style={[styles.sessionCount, { color: colors.mutedForeground }]}>
                  {t('pomodoro.session', { current: sessionsCompleted + 1, total: settings.sessionsBeforeLongBreak })}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Linked Task */}
        <View>
          <Pressable
            style={[styles.linkedTask, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowTaskSelector(true)}
          >
            {linkedTask ? (
              <>
                <Link2 size={18} color={colors.accent} />
                <Text
                  style={[styles.linkedTaskText, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {linkedTask.title}
                </Text>
              </>
            ) : (
              <>
                <Link2Off size={18} color={colors.mutedForeground} />
                <Text style={[styles.linkedTaskText, { color: colors.mutedForeground }]}>
                  {t('pomodoro.linkTask')}
                </Text>
              </>
            )}
            <ChevronRight size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>

        {/* Controls */}
        <View
         
          style={styles.controls}
        >
          <Pressable
            style={[styles.controlButton, { backgroundColor: colors.card }]}
            onPress={reset}
          >
            <RotateCcw size={24} color={colors.mutedForeground} />
          </Pressable>

          <Pressable
            style={[styles.playButton, { backgroundColor: modeColor }]}
            onPress={handlePlayPause}
          >
            {state === 'running' ? (
              <Pause size={32} color="#fff" />
            ) : (
              <Play size={32} color="#fff" style={{ marginLeft: 4 }} />
            )}
          </Pressable>

          <Pressable
            style={[styles.controlButton, { backgroundColor: colors.card }]}
            onPress={skip}
          >
            <SkipForward size={24} color={colors.mutedForeground} />
          </Pressable>
        </View>

        {/* Today's Stats */}
        <View style={styles.statsSection}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={20} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {t('pomodoro.stats.today')}
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <StatCard
              icon={<Timer size={20} color="#8b5cf6" />}
              label={t('pomodoro.stats.sessions')}
              value={stats.today.workSessions}
              color="#8b5cf6"
            />
            <StatCard
              icon={<Zap size={20} color="#22c55e" />}
              label={t('pomodoro.stats.minutes')}
              value={stats.today.totalMinutes}
              color="#22c55e"
            />
            <StatCard
              icon={<TrendingUp size={20} color="#f97316" />}
              label={t('pomodoro.stats.streak')}
              value={stats.streak}
              color="#f97316"
            />
            <StatCard
              icon={<Calendar size={20} color="#3b82f6" />}
              label={t('pomodoro.stats.thisWeek')}
              value={stats.week.workSessions}
              color="#3b82f6"
            />
          </View>
        </View>

        {/* View History Link */}
        <View>
          <Pressable
            style={[styles.historyLink, { backgroundColor: colors.card }, cardShadow]}
            onPress={() => router.push('/pomodoro/history')}
          >
            <Calendar size={20} color={colors.accent} />
            <Text style={[styles.historyLinkText, { color: colors.foreground }]}>
              {t('pomodoro.viewHistory')}
            </Text>
            <ChevronRight size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </ScrollView>

      {/* Task Selector Modal */}
      <TaskSelectorModal
        visible={showTaskSelector}
        onClose={() => setShowTaskSelector(false)}
        onSelect={linkTask}
      />
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
  headerButton: {
    padding: spacing[2],
  },

  // Mode Tabs
  modeTabs: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[4],
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1.5],
    paddingVertical: spacing[2.5],
    paddingHorizontal: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  modeTabText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },

  // Timer
  timerContainer: {
    alignItems: 'center',
    marginTop: spacing[8],
  },
  timerCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerSvg: {
    position: 'absolute',
  },
  timerDisplay: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 64,
    fontWeight: typography.weight.bold,
    fontVariant: ['tabular-nums'],
  },
  timerMode: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: spacing[1],
  },
  sessionCount: {
    fontSize: typography.size.xs,
    marginTop: spacing[2],
  },

  // Linked Task
  linkedTask: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[6],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  linkedTaskText: {
    flex: 1,
    fontSize: typography.size.sm,
  },

  // Controls
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
    marginTop: spacing[8],
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...cardShadow,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },

  // Stats Section
  statsSection: {
    marginTop: spacing[8],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
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

  // History Link
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginTop: spacing[4],
    padding: spacing[4],
    borderRadius: radius.xl,
  },
  historyLinkText: {
    flex: 1,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    padding: spacing[5],
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing[4],
    textAlign: 'center',
  },
  taskList: {
    marginBottom: spacing[4],
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
  },
  taskItemText: {
    flex: 1,
    fontSize: typography.size.sm,
  },
  modalCloseButton: {
    padding: spacing[4],
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
})
