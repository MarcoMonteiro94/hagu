import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  FolderKanban,
  Target,
  Calendar,
  ChevronRight,
  Pause,
  CheckCircle2,
  Clock,
} from 'lucide-react-native'
import { useTheme, cardShadow, spacing, radius, typography } from '@/theme'
import type { ProjectWithProgress, ProjectStatus } from '@hagu/core'

const STATUS_ICONS: Record<ProjectStatus, typeof FolderKanban> = {
  active: FolderKanban,
  paused: Pause,
  completed: CheckCircle2,
  archived: Clock,
}

const STATUS_COLORS = {
  active: 'primary',
  paused: 'warning',
  completed: 'success',
  archived: 'mutedForeground',
} as const

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

interface ProjectCardProps {
  project: ProjectWithProgress
  onPress: (project: ProjectWithProgress) => void
  index?: number
}

export function ProjectCard({ project, onPress, index = 0 }: ProjectCardProps) {
  const { t, i18n } = useTranslation()
  const { colors } = useTheme()

  const StatusIcon = STATUS_ICONS[project.status]
  const statusColorKey = STATUS_COLORS[project.status]
  const statusColor = colors[statusColorKey]
  const projectColor = project.color || colors.primary
  const isCompleted = project.status === 'completed'
  const overdue = project.dueDate && !isCompleted && isOverdue(project.dueDate)

  return (
    <View>
      <Pressable
        onPress={() => onPress(project)}
        style={[styles.card, { backgroundColor: colors.card }, cardShadow]}
      >
        {/* Color indicator */}
        <View style={[styles.colorIndicator, { backgroundColor: projectColor }]} />

        {/* Main content */}
        <View style={styles.content}>
          {/* Header with icon and title */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: projectColor + '20' }]}>
              <FolderKanban size={18} color={projectColor} />
            </View>
            <View style={styles.titleContainer}>
              <Text
                style={[
                  styles.title,
                  { color: colors.foreground },
                  isCompleted && styles.titleCompleted,
                  isCompleted && { color: colors.mutedForeground },
                ]}
                numberOfLines={1}
              >
                {project.title}
              </Text>
              {project.description && (
                <Text
                  style={[styles.description, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {project.description}
                </Text>
              )}
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: isCompleted ? colors.success : projectColor,
                    width: `${project.progress}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
              {project.progress}%
            </Text>
          </View>

          {/* Meta row */}
          <View style={styles.metaRow}>
            {/* Status badge */}
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <StatusIcon size={12} color={statusColor} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {t(`projects.status.${project.status}`)}
              </Text>
            </View>

            {/* Objectives count */}
            <View style={styles.metaItem}>
              <Target size={14} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                {project.completedObjectivesCount}/{project.objectivesCount}
              </Text>
            </View>

            {/* Due date */}
            {project.dueDate && (
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
                  {formatDueDate(project.dueDate, i18n.language)}
                </Text>
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
  colorIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  content: {
    flex: 1,
    marginLeft: spacing[2],
    marginRight: spacing[2],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
  },
  description: {
    fontSize: typography.size.sm - 1,
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    minWidth: 32,
    textAlign: 'right',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[2],
    gap: spacing[3],
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
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  metaText: {
    fontSize: typography.size.xs,
  },
})
