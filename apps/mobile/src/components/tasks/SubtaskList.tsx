import { useState, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { Plus, Check, X, Trash2, Edit3 } from 'lucide-react-native'
import { useTheme, spacing, radius, typography } from '@/theme'
import type { Subtask } from '@hagu/core'

interface SubtaskListProps {
  taskId: string
  subtasks: Subtask[]
  onAdd: (title: string) => void
  onToggle: (subtaskId: string) => void
  onUpdate: (subtaskId: string, title: string) => void
  onDelete: (subtaskId: string) => void
  isAdding?: boolean
  isToggling?: boolean
}

export function SubtaskList({
  taskId,
  subtasks,
  onAdd,
  onToggle,
  onUpdate,
  onDelete,
  isAdding,
  isToggling,
}: SubtaskListProps) {
  const { t } = useTranslation()
  const { colors } = useTheme()

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [showAddInput, setShowAddInput] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  const completedCount = subtasks.filter((s) => s.done).length
  const totalCount = subtasks.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const handleAdd = useCallback(() => {
    if (newSubtaskTitle.trim()) {
      onAdd(newSubtaskTitle.trim())
      setNewSubtaskTitle('')
      setShowAddInput(false)
    }
  }, [newSubtaskTitle, onAdd])

  const handleStartEdit = useCallback((subtask: Subtask) => {
    setEditingId(subtask.id)
    setEditingTitle(subtask.title)
  }, [])

  const handleSaveEdit = useCallback(() => {
    if (editingId && editingTitle.trim()) {
      onUpdate(editingId, editingTitle.trim())
    }
    setEditingId(null)
    setEditingTitle('')
  }, [editingId, editingTitle, onUpdate])

  const handleCancelEdit = useCallback(() => {
    setEditingId(null)
    setEditingTitle('')
  }, [])

  const handleDelete = useCallback(
    (subtaskId: string, subtaskTitle: string) => {
      Alert.alert(
        t('tasks.subtasks.deleteTitle'),
        t('tasks.subtasks.deleteConfirm', { title: subtaskTitle }),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.delete'),
            style: 'destructive',
            onPress: () => onDelete(subtaskId),
          },
        ]
      )
    },
    [onDelete, t]
  )

  return (
    <View style={styles.container}>
      {/* Header with Progress */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {t('tasks.subtasks.title')}
        </Text>
        {totalCount > 0 && (
          <Text style={[styles.progress, { color: colors.mutedForeground }]}>
            {completedCount}/{totalCount}
          </Text>
        )}
      </View>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.success,
                width: `${progress}%`,
              },
            ]}
          />
        </View>
      )}

      {/* Subtask List */}
      <View style={styles.list}>
        {subtasks.map((subtask, index) => (
          <View
            key={subtask.id}
            style={[styles.subtaskItem, { backgroundColor: colors.secondary }]}
          >
            {editingId === subtask.id ? (
              // Edit Mode
              <View style={styles.editRow}>
                <TextInput
                  style={[
                    styles.editInput,
                    {
                      color: colors.foreground,
                      borderColor: colors.accent,
                    },
                  ]}
                  value={editingTitle}
                  onChangeText={setEditingTitle}
                  autoFocus
                  onSubmitEditing={handleSaveEdit}
                />
                <Pressable
                  onPress={handleSaveEdit}
                  style={[styles.editButton, { backgroundColor: colors.success }]}
                >
                  <Check size={16} color={colors.white} />
                </Pressable>
                <Pressable
                  onPress={handleCancelEdit}
                  style={[styles.editButton, { backgroundColor: colors.muted }]}
                >
                  <X size={16} color={colors.foreground} />
                </Pressable>
              </View>
            ) : (
              // Display Mode
              <View style={styles.subtaskRow}>
                <Pressable
                  onPress={() => onToggle(subtask.id)}
                  disabled={isToggling}
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: subtask.done ? colors.success : 'transparent',
                      borderColor: subtask.done ? colors.success : colors.border,
                    },
                  ]}
                >
                  {subtask.done && <Check size={14} color={colors.white} />}
                </Pressable>
                <Text
                  style={[
                    styles.subtaskTitle,
                    {
                      color: subtask.done ? colors.mutedForeground : colors.foreground,
                      textDecorationLine: subtask.done ? 'line-through' : 'none',
                    },
                  ]}
                  numberOfLines={2}
                >
                  {subtask.title}
                </Text>
                <View style={styles.subtaskActions}>
                  <Pressable
                    onPress={() => handleStartEdit(subtask)}
                    style={styles.actionButton}
                    hitSlop={8}
                  >
                    <Edit3 size={16} color={colors.mutedForeground} />
                  </Pressable>
                  <Pressable
                    onPress={() => handleDelete(subtask.id, subtask.title)}
                    style={styles.actionButton}
                    hitSlop={8}
                  >
                    <Trash2 size={16} color={colors.error} />
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Add Subtask */}
      {showAddInput ? (
        <View
         
          style={[styles.addInputContainer, { backgroundColor: colors.secondary }]}
        >
          <TextInput
            style={[
              styles.addInput,
              {
                color: colors.foreground,
                borderColor: colors.accent,
              },
            ]}
            value={newSubtaskTitle}
            onChangeText={setNewSubtaskTitle}
            placeholder={t('tasks.subtasks.placeholder')}
            placeholderTextColor={colors.mutedForeground}
            autoFocus
            onSubmitEditing={handleAdd}
          />
          <Pressable
            onPress={handleAdd}
            disabled={!newSubtaskTitle.trim() || isAdding}
            style={[
              styles.addButton,
              {
                backgroundColor: newSubtaskTitle.trim() ? colors.accent : colors.muted,
              },
            ]}
          >
            <Check size={18} color={colors.white} />
          </Pressable>
          <Pressable
            onPress={() => {
              setShowAddInput(false)
              setNewSubtaskTitle('')
            }}
            style={[styles.cancelButton, { backgroundColor: colors.muted }]}
          >
            <X size={18} color={colors.foreground} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => setShowAddInput(true)}
          style={[styles.showAddButton, { borderColor: colors.border }]}
        >
          <Plus size={18} color={colors.accent} />
          <Text style={[styles.showAddText, { color: colors.accent }]}>
            {t('tasks.subtasks.add')}
          </Text>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[3],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  progress: {
    fontSize: typography.size.sm,
  },
  progressBar: {
    height: 4,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  list: {
    gap: spacing[2],
  },
  subtaskItem: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    gap: spacing[3],
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskTitle: {
    flex: 1,
    fontSize: typography.size.sm,
    lineHeight: 20,
  },
  subtaskActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  actionButton: {
    padding: spacing[1],
  },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[2],
    gap: spacing[2],
  },
  editInput: {
    flex: 1,
    fontSize: typography.size.sm,
    padding: spacing[2],
    borderRadius: radius.md,
    borderWidth: 1,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[2],
    borderRadius: radius.lg,
    gap: spacing[2],
  },
  addInput: {
    flex: 1,
    fontSize: typography.size.sm,
    padding: spacing[2],
    borderRadius: radius.md,
    borderWidth: 1,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  showAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  showAddText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
})
