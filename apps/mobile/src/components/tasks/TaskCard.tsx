import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  ChevronRight,
  Repeat,
} from 'lucide-react-native'
import { useTheme, cardShadow, spacing, radius, typography, priorityColors } from '@/theme'
import type { Task, TaskPriority, TaskStatus } from '@hagu/core'

const STATUS_ICONS: Record<TaskStatus, typeof CheckCircle2> = {
  pending: Circle,
  in_progress: Clock,
  done: CheckCircle2,
}

function formatDueDate(dueDate: string, locale: string): string {
  const date = new Date(dueDate)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const dateOnly = date.toISOString().split('T')[0]
  const todayOnly = today.toISOString().split('T')[0]
  const tomorrowOnly = tomorrow.toISOString().split('T')[0]

  if (dateOnly === todayOnly) return locale === 'pt-BR' ? 'Hoje' : 'Today'
  if (dateOnly === tomorrowOnly) return locale === 'pt-BR' ? 'Amanhã' : 'Tomorrow'

  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
}

function isOverdue(dueDate: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return due < today
}

interface TaskCardProps {
  task: Task
  onToggleStatus: (id: string, currentStatus: TaskStatus) => void
  onPress: (task: Task) => void
  index?: number
  selectionMode?: boolean
  isSelected?: boolean
  onSelect?: (task: Task) => void
}

export function TaskCard({
  task,
  onToggleStatus,
  onPress,
  index = 0,
  selectionMode = false,
  isSelected = false,
  onSelect,
}: TaskCardProps) {
  const { t, i18n } = useTranslation()
  const { colors } = useTheme()

  const StatusIcon = STATUS_ICONS[task.status]
  const isDone = task.status === 'done'
  const overdue = task.dueDate && !isDone && isOverdue(task.dueDate)

  const handleToggle = () => {
    if (selectionMode && onSelect) {
      onSelect(task)
    } else {
      const nextStatus: TaskStatus = isDone ? 'pending' : 'done'
      onToggleStatus(task.id, nextStatus)
    }
  }

  const handlePress = () => {
    if (selectionMode && onSelect) {
      onSelect(task)
    } else {
      onPress(task)
    }
  }

  const handleLongPress = () => {
    if (!selectionMode && onSelect) {
      onSelect(task)
    }
  }

  const priorityColor = task.priority ? priorityColors[task.priority].hex : undefined

  return (
    <View>
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={500}
        style={[
          styles.card,
          { backgroundColor: colors.card },
          cardShadow,
          isSelected && { backgroundColor: colors.accent + '15', borderColor: colors.accent, borderWidth: 2 },
        ]}
      >
        {/* Priority indicator */}
        {priorityColor && !isSelected && (
          <View style={[styles.priorityIndicator, { backgroundColor: priorityColor }]} />
        )}

        {/* Checkbox / Selection */}
        <Pressable onPress={handleToggle} style={styles.checkbox} hitSlop={8}>
          {selectionMode ? (
            <View
              style={[
                styles.selectionCircle,
                {
                  backgroundColor: isSelected ? colors.accent : 'transparent',
                  borderColor: isSelected ? colors.accent : colors.border,
                },
              ]}
            >
              {isSelected && <CheckCircle2 size={20} color={colors.white} />}
            </View>
          ) : (
            <StatusIcon
              size={24}
              color={isDone ? colors.success : colors.mutedForeground}
              strokeWidth={isDone ? 2.5 : 1.5}
            />
          )}
        </Pressable>

        {/* Content */}
        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              { color: colors.foreground },
              isDone && styles.titleDone,
              isDone && { color: colors.mutedForeground },
            ]}
            numberOfLines={2}
          >
            {task.title}
          </Text>

          {/* Meta row */}
          <View style={styles.metaRow}>
            {task.dueDate && (
              <View style={styles.metaItem}>
                <Calendar
                  size={14}
                  color={overdue ? colors.error : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.metaText,
                    { color: overdue ? colors.error : colors.mutedForeground },
                  ]}
                >
                  {formatDueDate(task.dueDate, i18n.language)}
                </Text>
              </View>
            )}

            {task.priority && (
              <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
                <Text style={[styles.priorityText, { color: priorityColor }]}>
                  {t(`tasks.${task.priority}`)}
                </Text>
              </View>
            )}

            {task.subtasks.length > 0 && (
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length}
              </Text>
            )}

            {task.recurrence && (
              <View style={styles.metaItem}>
                <Repeat size={14} color={colors.accent} />
              </View>
            )}
          </View>
        </View>

        {/* Chevron */}
        <ChevronRight size={20} color={colors.mutedForeground} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  priorityIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  checkbox: {
    marginRight: spacing[3],
  },
  selectionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginRight: spacing[2],
  },
  title: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    lineHeight: 22,
  },
  titleDone: {
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[1.5],
    gap: spacing[3],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  metaText: {
    fontSize: typography.size.sm - 1,
  },
  priorityBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: radius.sm,
  },
  priorityText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
})
