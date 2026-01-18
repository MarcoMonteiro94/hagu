import { useState, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import DateTimePicker from '@react-native-community/datetimepicker'
import {
  Plus,
  Flag,
  Calendar,
  CheckCircle2,
  Trash2,
  Clock,
} from 'lucide-react-native'
import Animated, { FadeInDown, FadeIn, Layout } from 'react-native-reanimated'
import { useTheme, cardShadow, spacing, radius, typography } from '@/theme'
import type { Milestone, MilestoneStatus } from '@hagu/core'

const STATUS_COLORS = {
  upcoming: 'info',
  in_progress: 'warning',
  completed: 'success',
  missed: 'error',
} as const

interface MilestoneTimelineProps {
  milestones: Milestone[]
  projectColor: string
  onAdd: (title: string, targetDate: string) => Promise<void>
  onComplete: (id: string) => Promise<void>
  onDelete: (id: string) => void
  isAdding?: boolean
}

function formatDate(date: string, locale: string): string {
  return new Date(date).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getDaysUntil(date: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function MilestoneTimeline({
  milestones,
  projectColor,
  onAdd,
  onComplete,
  onDelete,
  isAdding = false,
}: MilestoneTimelineProps) {
  const { t, i18n } = useTranslation()
  const { colors } = useTheme()

  const [showInput, setShowInput] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDate, setNewDate] = useState<Date>(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)

  const handleAdd = useCallback(async () => {
    if (!newTitle.trim()) return
    try {
      await onAdd(newTitle.trim(), newDate.toISOString().split('T')[0])
      setNewTitle('')
      setNewDate(new Date())
      setShowInput(false)
    } catch (error) {
      Alert.alert(t('common.error'))
    }
  }, [newTitle, newDate, onAdd, t])

  const handleDateChange = useCallback(
    (_event: unknown, selectedDate?: Date) => {
      if (Platform.OS === 'android') {
        setShowDatePicker(false)
      }
      if (selectedDate) {
        setNewDate(selectedDate)
      }
    },
    []
  )

  const completedCount = milestones.filter((m) => m.status === 'completed').length

  return (
    <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {t('projects.milestone.title')}
        </Text>
        <Text style={[styles.count, { color: colors.mutedForeground }]}>
          {completedCount}/{milestones.length}
        </Text>
      </View>

      {/* Timeline */}
      {milestones.length === 0 && !showInput ? (
        <View style={styles.emptyState}>
          <Flag size={32} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {t('projects.milestone.noMilestones')}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
            {t('projects.milestone.emptyDescription')}
          </Text>
        </View>
      ) : (
        <View style={styles.timeline}>
          {milestones.map((milestone, index) => {
            const statusColorKey = STATUS_COLORS[milestone.status]
            const statusColor = colors[statusColorKey]
            const daysUntil = getDaysUntil(milestone.targetDate)
            const isLast = index === milestones.length - 1

            return (
              <Animated.View
                key={milestone.id}
                entering={FadeIn.delay(index * 50).duration(300)}
                layout={Layout.springify()}
                style={styles.timelineItem}
              >
                {/* Timeline line */}
                <View style={styles.timelineLeft}>
                  <View
                    style={[
                      styles.timelineDot,
                      {
                        backgroundColor:
                          milestone.status === 'completed' ? colors.success : statusColor,
                        borderColor:
                          milestone.status === 'completed' ? colors.success : statusColor,
                      },
                    ]}
                  >
                    {milestone.status === 'completed' ? (
                      <CheckCircle2 size={14} color={colors.white} />
                    ) : (
                      <Flag size={10} color={colors.white} />
                    )}
                  </View>
                  {!isLast && (
                    <View
                      style={[
                        styles.timelineLine,
                        {
                          backgroundColor:
                            milestone.status === 'completed' ? colors.success + '40' : colors.border,
                        },
                      ]}
                    />
                  )}
                </View>

                {/* Content */}
                <View
                  style={[
                    styles.timelineContent,
                    { backgroundColor: colors.card },
                    cardShadow,
                  ]}
                >
                  <View style={styles.milestoneHeader}>
                    <Text
                      style={[
                        styles.milestoneTitle,
                        { color: colors.foreground },
                        milestone.status === 'completed' && styles.milestoneTitleDone,
                        milestone.status === 'completed' && { color: colors.mutedForeground },
                      ]}
                      numberOfLines={2}
                    >
                      {milestone.title}
                    </Text>
                    <View style={styles.milestoneActions}>
                      {milestone.status !== 'completed' && (
                        <Pressable
                          onPress={() => onComplete(milestone.id)}
                          hitSlop={8}
                          style={styles.actionButton}
                        >
                          <CheckCircle2 size={18} color={colors.success} />
                        </Pressable>
                      )}
                      <Pressable
                        onPress={() => onDelete(milestone.id)}
                        hitSlop={8}
                        style={styles.actionButton}
                      >
                        <Trash2 size={18} color={colors.mutedForeground} />
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.milestoneMeta}>
                    <View style={styles.metaItem}>
                      <Calendar size={14} color={colors.mutedForeground} />
                      <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                        {formatDate(milestone.targetDate, i18n.language)}
                      </Text>
                    </View>

                    {milestone.status !== 'completed' && (
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: statusColor + '20' },
                        ]}
                      >
                        <Clock size={12} color={statusColor} />
                        <Text style={[styles.statusText, { color: statusColor }]}>
                          {daysUntil < 0
                            ? t('projects.stats.overdue')
                            : daysUntil === 0
                            ? t('habits.today')
                            : `${daysUntil}d`}
                        </Text>
                      </View>
                    )}

                    {milestone.status === 'completed' && (
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: colors.success + '20' },
                        ]}
                      >
                        <CheckCircle2 size={12} color={colors.success} />
                        <Text style={[styles.statusText, { color: colors.success }]}>
                          {t('projects.milestone.status.completed')}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Animated.View>
            )
          })}
        </View>
      )}

      {/* Add Input */}
      {showInput ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[styles.inputContainer, { backgroundColor: colors.card }, cardShadow]}
        >
          <TextInput
            style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
            value={newTitle}
            onChangeText={setNewTitle}
            placeholder={t('projects.milestone.titlePlaceholder')}
            placeholderTextColor={colors.mutedForeground}
            autoFocus
          />

          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={[styles.dateButton, { backgroundColor: colors.background, borderColor: colors.border }]}
          >
            <Calendar size={18} color={colors.mutedForeground} />
            <Text style={[styles.dateText, { color: colors.foreground }]}>
              {formatDate(newDate.toISOString(), i18n.language)}
            </Text>
          </Pressable>

          {showDatePicker && (
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={newDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
              {Platform.OS === 'ios' && (
                <Pressable
                  onPress={() => setShowDatePicker(false)}
                  style={[styles.datePickerDone, { backgroundColor: projectColor }]}
                >
                  <Text style={styles.datePickerDoneText}>{t('common.confirm')}</Text>
                </Pressable>
              )}
            </View>
          )}

          <View style={styles.inputActions}>
            <Pressable
              onPress={() => {
                setShowInput(false)
                setNewTitle('')
                setNewDate(new Date())
              }}
              style={[styles.inputButton, { backgroundColor: colors.border }]}
            >
              <Text style={[styles.inputButtonText, { color: colors.foreground }]}>
                {t('common.cancel')}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleAdd}
              disabled={!newTitle.trim() || isAdding}
              style={[
                styles.inputButton,
                { backgroundColor: projectColor },
                (!newTitle.trim() || isAdding) && { opacity: 0.5 },
              ]}
            >
              <Text style={styles.inputButtonTextWhite}>
                {isAdding ? t('common.loading') : t('common.add')}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      ) : (
        <Pressable
          onPress={() => setShowInput(true)}
          style={[styles.addButton, { borderColor: colors.border }]}
        >
          <Plus size={20} color={projectColor} />
          <Text style={[styles.addButtonText, { color: projectColor }]}>
            {t('projects.milestone.add')}
          </Text>
        </Pressable>
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  title: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  count: {
    fontSize: typography.size.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[6],
  },
  emptyText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    marginTop: spacing[3],
  },
  emptySubtext: {
    fontSize: typography.size.sm,
    marginTop: spacing[1],
    textAlign: 'center',
  },
  timeline: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineLeft: {
    width: 32,
    alignItems: 'center',
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    zIndex: 1,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: -2,
  },
  timelineContent: {
    flex: 1,
    marginLeft: spacing[2],
    marginBottom: spacing[3],
    padding: spacing[3],
    borderRadius: radius.lg,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  milestoneTitle: {
    flex: 1,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    lineHeight: 20,
  },
  milestoneTitleDone: {
    textDecorationLine: 'line-through',
  },
  milestoneActions: {
    flexDirection: 'row',
    gap: spacing[1],
    marginLeft: spacing[2],
  },
  actionButton: {
    padding: spacing[1],
  },
  milestoneMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginTop: spacing[2],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  metaText: {
    fontSize: typography.size.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: radius.sm,
  },
  statusText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  inputContainer: {
    marginTop: spacing[3],
    padding: spacing[3],
    borderRadius: radius.lg,
    gap: spacing[3],
  },
  input: {
    fontSize: typography.size.sm,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderWidth: 1,
    borderRadius: radius.md,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderWidth: 1,
    borderRadius: radius.md,
  },
  dateText: {
    fontSize: typography.size.sm,
  },
  datePickerContainer: {
    marginTop: spacing[2],
  },
  datePickerDone: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.md,
    marginTop: spacing[2],
  },
  datePickerDoneText: {
    color: '#fff',
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing[2],
  },
  inputButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.md,
  },
  inputButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  inputButtonTextWhite: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: '#fff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    marginTop: spacing[3],
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
  },
  addButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
})
