import { useState, useCallback } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import {
  X,
  Trash2,
  Edit3,
  Calendar,
  Flag,
  CheckCircle2,
  Circle,
  Clock,
} from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useTheme, spacing, radius, typography, cardShadow } from '@/theme'
import { TaskForm, type TaskFormData, SubtaskList } from '@/components/tasks'
import {
  useTaskQuery,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useUpdateTaskStatus,
  useAddSubtask,
  useToggleSubtask,
  useUpdateSubtask,
  useDeleteSubtask,
} from '@/hooks'
import type { TaskStatus, TaskPriority } from '@hagu/core'

const STATUS_ICONS: Record<TaskStatus, typeof CheckCircle2> = {
  pending: Circle,
  in_progress: Clock,
  done: CheckCircle2,
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#f97316',
  urgent: '#ef4444',
}

export default function TaskModal() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { t } = useTranslation()
  const { colors } = useTheme()

  const isNew = id === 'new'
  const { data: task, isLoading: isLoadingTask } = useTaskQuery(isNew ? undefined : id)

  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const updateStatus = useUpdateTaskStatus()

  // Subtask mutations
  const addSubtask = useAddSubtask()
  const toggleSubtask = useToggleSubtask()
  const updateSubtask = useUpdateSubtask()
  const deleteSubtaskMutation = useDeleteSubtask()

  const [isEditing, setIsEditing] = useState(isNew)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: TaskFormData) => {
    setIsSubmitting(true)
    try {
      if (isNew) {
        await createTask.mutateAsync(data)
        router.back()
      } else {
        await updateTask.mutateAsync({ id, updates: data })
        setIsEditing(false)
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('tasks.saveError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = () => {
    Alert.alert(
      t('tasks.deleteTitle'),
      t('tasks.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask.mutateAsync(id)
              router.back()
            } catch (error) {
              Alert.alert(t('common.error'), t('tasks.deleteError'))
            }
          },
        },
      ]
    )
  }

  const handleCancel = () => {
    if (isNew) {
      router.back()
    } else {
      setIsEditing(false)
    }
  }

  const handleStatusChange = useCallback(
    async (status: TaskStatus) => {
      try {
        await updateStatus.mutateAsync({ id, status })
      } catch (error) {
        Alert.alert(t('common.error'), t('tasks.saveError'))
      }
    },
    [id, updateStatus, t]
  )

  // Subtask handlers
  const handleAddSubtask = useCallback(
    async (title: string) => {
      try {
        await addSubtask.mutateAsync({ taskId: id, title })
      } catch (error) {
        Alert.alert(t('common.error'), t('tasks.subtasks.addError'))
      }
    },
    [id, addSubtask, t]
  )

  const handleToggleSubtask = useCallback(
    async (subtaskId: string) => {
      try {
        await toggleSubtask.mutateAsync({ subtaskId, taskId: id })
      } catch (error) {
        Alert.alert(t('common.error'), t('tasks.subtasks.toggleError'))
      }
    },
    [id, toggleSubtask, t]
  )

  const handleUpdateSubtask = useCallback(
    async (subtaskId: string, title: string) => {
      try {
        await updateSubtask.mutateAsync({ subtaskId, title, taskId: id })
      } catch (error) {
        Alert.alert(t('common.error'), t('tasks.subtasks.updateError'))
      }
    },
    [id, updateSubtask, t]
  )

  const handleDeleteSubtask = useCallback(
    async (subtaskId: string) => {
      try {
        await deleteSubtaskMutation.mutateAsync({ subtaskId, taskId: id })
      } catch (error) {
        Alert.alert(t('common.error'), t('tasks.subtasks.deleteError'))
      }
    },
    [id, deleteSubtaskMutation, t]
  )

  if (!isNew && isLoadingTask) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            {t('common.loading')}
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  // Show form when editing or creating new
  if (isEditing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={handleCancel} style={styles.headerButton} hitSlop={8}>
            <X size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {isNew ? t('tasks.addTask') : t('tasks.editTask')}
          </Text>
          {!isNew && (
            <Pressable onPress={handleDelete} style={styles.headerButton} hitSlop={8}>
              <Trash2 size={22} color={colors.error} />
            </Pressable>
          )}
          {isNew && <View style={styles.headerButton} />}
        </View>

        {/* Form */}
        <TaskForm
          task={isNew ? null : task}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isSubmitting}
        />
      </SafeAreaView>
    )
  }

  // Show detail view
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.headerButton} hitSlop={8}>
          <X size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {t('tasks.taskDetail')}
        </Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => setIsEditing(true)} style={styles.headerButton} hitSlop={8}>
            <Edit3 size={22} color={colors.foreground} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {task && (
          <>
            {/* Task Info Card */}
            <Animated.View
              entering={FadeInDown.delay(50).duration(400)}
              style={[styles.card, { backgroundColor: colors.card }, cardShadow]}
            >
              {/* Title */}
              <Text style={[styles.taskTitle, { color: colors.foreground }]}>
                {task.title}
              </Text>

              {/* Description */}
              {task.description && (
                <Text style={[styles.taskDescription, { color: colors.mutedForeground }]}>
                  {task.description}
                </Text>
              )}

              {/* Meta info */}
              <View style={styles.metaRow}>
                {/* Due Date */}
                {task.dueDate && (
                  <View style={[styles.metaItem, { backgroundColor: colors.secondary }]}>
                    <Calendar size={14} color={colors.mutedForeground} />
                    <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                      {new Date(task.dueDate).toLocaleDateString()}
                    </Text>
                  </View>
                )}

                {/* Priority */}
                {task.priority && (
                  <View
                    style={[
                      styles.metaItem,
                      { backgroundColor: PRIORITY_COLORS[task.priority] + '20' },
                    ]}
                  >
                    <Flag size={14} color={PRIORITY_COLORS[task.priority]} />
                    <Text
                      style={[styles.metaText, { color: PRIORITY_COLORS[task.priority] }]}
                    >
                      {t(`tasks.${task.priority}`)}
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>

            {/* Status Selector */}
            <Animated.View
              entering={FadeInDown.delay(100).duration(400)}
              style={[styles.card, { backgroundColor: colors.card }, cardShadow]}
            >
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {t('tasks.status')}
              </Text>
              <View style={styles.statusRow}>
                {(['pending', 'in_progress', 'done'] as TaskStatus[]).map((status) => {
                  const isSelected = task.status === status
                  const StatusIcon = STATUS_ICONS[status]
                  const statusColor =
                    status === 'done'
                      ? colors.success
                      : status === 'in_progress'
                        ? colors.warning
                        : colors.mutedForeground

                  return (
                    <Pressable
                      key={status}
                      onPress={() => handleStatusChange(status)}
                      style={[
                        styles.statusButton,
                        {
                          backgroundColor: isSelected
                            ? statusColor + '20'
                            : colors.secondary,
                          borderColor: isSelected ? statusColor : 'transparent',
                        },
                      ]}
                    >
                      <StatusIcon size={18} color={isSelected ? statusColor : colors.mutedForeground} />
                      <Text
                        style={[
                          styles.statusText,
                          { color: isSelected ? statusColor : colors.mutedForeground },
                        ]}
                      >
                        {t(`tasks.${status}`)}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </Animated.View>

            {/* Subtasks */}
            <Animated.View
              entering={FadeInDown.delay(150).duration(400)}
              style={[styles.card, { backgroundColor: colors.card }, cardShadow]}
            >
              <SubtaskList
                taskId={id}
                subtasks={task.subtasks || []}
                onAdd={handleAddSubtask}
                onToggle={handleToggleSubtask}
                onUpdate={handleUpdateSubtask}
                onDelete={handleDeleteSubtask}
                isAdding={addSubtask.isPending}
                isToggling={toggleSubtask.isPending}
              />
            </Animated.View>

            {/* Delete Button */}
            <Animated.View entering={FadeInDown.delay(200).duration(400)}>
              <Pressable
                onPress={handleDelete}
                style={[styles.deleteButton, { backgroundColor: colors.error + '15' }]}
              >
                <Trash2 size={18} color={colors.error} />
                <Text style={[styles.deleteText, { color: colors.error }]}>
                  {t('tasks.deleteTask')}
                </Text>
              </Pressable>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: typography.size.base,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    gap: spacing[4],
    paddingBottom: spacing[8],
  },
  card: {
    padding: spacing[4],
    borderRadius: radius['2xl'],
  },
  taskTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing[2],
  },
  taskDescription: {
    fontSize: typography.size.base,
    lineHeight: 24,
    marginBottom: spacing[3],
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: radius.full,
  },
  metaText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  sectionTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    marginBottom: spacing[3],
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1.5],
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  statusText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3.5],
    borderRadius: radius.xl,
  },
  deleteText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
})
