import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { Calendar, X, FolderKanban, ChevronDown } from 'lucide-react-native'
import { useTheme } from '@/theme'
import { DatePicker } from './DatePicker'
import { RecurrencePicker } from './RecurrencePicker'
import { useActiveProjectsQuery } from '@/hooks'
import type { Task, TaskPriority, TaskStatus, RecurrencePattern } from '@hagu/core'

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent']

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#f97316',
  urgent: '#ef4444',
}

export interface TaskFormData {
  title: string
  description?: string
  priority?: TaskPriority
  status: TaskStatus
  dueDate?: string
  tags: string[]
  recurrence?: RecurrencePattern
  projectId?: string
}

interface TaskFormProps {
  task?: Task | null
  onSubmit: (data: TaskFormData) => void
  onCancel: () => void
  isLoading?: boolean
  defaultProjectId?: string
}

export function TaskForm({ task, onSubmit, onCancel, isLoading, defaultProjectId }: TaskFormProps) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const { data: projects = [] } = useActiveProjectsQuery()

  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [priority, setPriority] = useState<TaskPriority | undefined>(task?.priority)
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'pending')
  const [dueDate, setDueDate] = useState<Date | undefined>(
    task?.dueDate ? new Date(task.dueDate) : undefined
  )
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [recurrence, setRecurrence] = useState<RecurrencePattern | undefined>(task?.recurrence)
  const [projectId, setProjectId] = useState<string | undefined>(
    task?.projectId ?? defaultProjectId
  )
  const [showProjectPicker, setShowProjectPicker] = useState(false)

  const selectedProject = projects.find((p) => p.id === projectId)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description ?? '')
      setPriority(task.priority)
      setStatus(task.status)
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined)
      setRecurrence(task.recurrence)
      setProjectId(task.projectId)
    }
  }, [task])

  const handleSubmit = () => {
    if (!title.trim()) return

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      status,
      dueDate: dueDate?.toISOString().split('T')[0],
      tags: task?.tags ?? [],
      recurrence,
      projectId,
    })
  }

  const clearDate = () => {
    setDueDate(undefined)
  }

  const isValid = title.trim().length > 0

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Title */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {t('tasks.titleLabel')}
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.secondary,
              color: colors.foreground,
              borderColor: colors.border,
            },
          ]}
          value={title}
          onChangeText={setTitle}
          placeholder={t('tasks.titlePlaceholder')}
          placeholderTextColor={colors.mutedForeground}
          autoFocus={!task}
        />
      </View>

      {/* Description */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {t('tasks.descriptionLabel')}
        </Text>
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            {
              backgroundColor: colors.secondary,
              color: colors.foreground,
              borderColor: colors.border,
            },
          ]}
          value={description}
          onChangeText={setDescription}
          placeholder={t('tasks.descriptionPlaceholder')}
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Project */}
      {projects.length > 0 && (
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            {t('tasks.project')}
          </Text>
          <Pressable
            onPress={() => setShowProjectPicker(!showProjectPicker)}
            style={[
              styles.projectButton,
              {
                backgroundColor: colors.secondary,
                borderColor: selectedProject ? selectedProject.color : colors.border,
              },
            ]}
          >
            {selectedProject ? (
              <>
                <View
                  style={[
                    styles.projectColorDot,
                    { backgroundColor: selectedProject.color },
                  ]}
                />
                <Text style={[styles.projectText, { color: colors.foreground }]}>
                  {selectedProject.title}
                </Text>
              </>
            ) : (
              <>
                <FolderKanban size={18} color={colors.mutedForeground} />
                <Text style={[styles.projectText, { color: colors.mutedForeground }]}>
                  {t('tasks.selectProject')}
                </Text>
              </>
            )}
            <ChevronDown size={18} color={colors.mutedForeground} />
          </Pressable>

          {showProjectPicker && (
            <View style={[styles.projectList, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* No project option */}
              <Pressable
                onPress={() => {
                  setProjectId(undefined)
                  setShowProjectPicker(false)
                }}
                style={[
                  styles.projectOption,
                  !projectId && { backgroundColor: colors.secondary },
                ]}
              >
                <Text style={[styles.projectOptionText, { color: colors.mutedForeground }]}>
                  {t('tasks.noProject')}
                </Text>
              </Pressable>

              {projects.map((project) => (
                <Pressable
                  key={project.id}
                  onPress={() => {
                    setProjectId(project.id)
                    setShowProjectPicker(false)
                  }}
                  style={[
                    styles.projectOption,
                    projectId === project.id && { backgroundColor: colors.secondary },
                  ]}
                >
                  <View
                    style={[
                      styles.projectColorDot,
                      { backgroundColor: project.color },
                    ]}
                  />
                  <Text style={[styles.projectOptionText, { color: colors.foreground }]}>
                    {project.title}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Due Date */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {t('tasks.dueDate')}
        </Text>
        <View style={styles.dateRow}>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            style={[
              styles.dateButton,
              {
                backgroundColor: colors.secondary,
                borderColor: colors.border,
              },
            ]}
          >
            <Calendar size={18} color={colors.mutedForeground} />
            <Text style={[styles.dateText, { color: dueDate ? colors.foreground : colors.mutedForeground }]}>
              {dueDate
                ? dueDate.toLocaleDateString()
                : t('tasks.selectDate')}
            </Text>
          </Pressable>
          {dueDate && (
            <Pressable
              onPress={clearDate}
              style={[styles.clearButton, { backgroundColor: colors.secondary }]}
            >
              <X size={18} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
        <DatePicker
          value={dueDate}
          onChange={setDueDate}
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          colors={colors}
        />
      </View>

      {/* Priority */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {t('tasks.priority')}
        </Text>
        <View style={styles.priorityRow}>
          {PRIORITIES.map((p) => {
            const isSelected = priority === p
            const priorityColor = PRIORITY_COLORS[p]
            return (
              <Pressable
                key={p}
                onPress={() => setPriority(isSelected ? undefined : p)}
                style={[
                  styles.priorityChip,
                  {
                    backgroundColor: isSelected
                      ? priorityColor + '20'
                      : colors.secondary,
                    borderColor: isSelected ? priorityColor : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.priorityText,
                    { color: isSelected ? priorityColor : colors.mutedForeground },
                  ]}
                >
                  {t(`tasks.${p}`)}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>

      {/* Recurrence */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {t('tasks.recurrence.label')}
        </Text>
        <RecurrencePicker value={recurrence} onChange={setRecurrence} />
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          onPress={onCancel}
          style={[styles.button, styles.cancelButton, { backgroundColor: colors.secondary }]}
        >
          <Text style={[styles.buttonText, { color: colors.foreground }]}>
            {t('common.cancel')}
          </Text>
        </Pressable>
        <Pressable
          onPress={handleSubmit}
          disabled={!isValid || isLoading}
          style={[
            styles.button,
            styles.submitButton,
            { backgroundColor: isValid ? colors.primary : colors.muted },
          ]}
        >
          <Text style={[styles.buttonText, styles.submitButtonText]}>
            {isLoading ? t('common.loading') : t('common.save')}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    gap: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    fontSize: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 100,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 16,
  },
  clearButton: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  projectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  projectColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  projectText: {
    flex: 1,
    fontSize: 16,
  },
  projectList: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  projectOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
  },
  projectOptionText: {
    fontSize: 14,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  priorityChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  cancelButton: {},
  submitButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButtonText: {
    color: '#fff',
  },
})
