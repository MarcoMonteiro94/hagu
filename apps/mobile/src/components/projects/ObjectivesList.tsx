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
import {
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Target,
} from 'lucide-react-native'
import Animated, { FadeInDown, FadeIn, Layout } from 'react-native-reanimated'
import { useTheme, cardShadow, spacing, radius, typography } from '@/theme'
import type { Objective, ObjectiveStatus } from '@hagu/core'

interface ObjectivesListProps {
  objectives: Objective[]
  projectColor: string
  onAdd: (title: string) => Promise<void>
  onToggle: (id: string, currentStatus: ObjectiveStatus) => Promise<void>
  onDelete: (id: string) => void
  isAdding?: boolean
}

export function ObjectivesList({
  objectives,
  projectColor,
  onAdd,
  onToggle,
  onDelete,
  isAdding = false,
}: ObjectivesListProps) {
  const { t } = useTranslation()
  const { colors } = useTheme()

  const [showInput, setShowInput] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const handleAdd = useCallback(async () => {
    if (!newTitle.trim()) return
    try {
      await onAdd(newTitle.trim())
      setNewTitle('')
      setShowInput(false)
    } catch (error) {
      Alert.alert(t('common.error'))
    }
  }, [newTitle, onAdd, t])

  const completedCount = objectives.filter((o) => o.status === 'completed').length

  return (
    <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {t('projects.objective.title')}
        </Text>
        <Text style={[styles.count, { color: colors.mutedForeground }]}>
          {completedCount}/{objectives.length}
        </Text>
      </View>

      {/* Objectives List */}
      {objectives.length === 0 && !showInput ? (
        <View style={styles.emptyState}>
          <Target size={32} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {t('projects.objective.noObjectives')}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
            {t('projects.objective.emptyDescription')}
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {objectives.map((objective, index) => (
            <Animated.View
              key={objective.id}
              entering={FadeIn.delay(index * 50).duration(300)}
              layout={Layout.springify()}
              style={[styles.item, { backgroundColor: colors.card }, cardShadow]}
            >
              <Pressable
                onPress={() => onToggle(objective.id, objective.status)}
                style={styles.checkbox}
                hitSlop={8}
              >
                {objective.status === 'completed' ? (
                  <CheckCircle2 size={22} color={colors.success} strokeWidth={2.5} />
                ) : (
                  <Circle size={22} color={colors.mutedForeground} strokeWidth={1.5} />
                )}
              </Pressable>

              <View style={styles.itemContent}>
                <Text
                  style={[
                    styles.itemTitle,
                    { color: colors.foreground },
                    objective.status === 'completed' && styles.itemTitleDone,
                    objective.status === 'completed' && { color: colors.mutedForeground },
                  ]}
                  numberOfLines={2}
                >
                  {objective.title}
                </Text>
                {objective.description && (
                  <Text
                    style={[styles.itemDescription, { color: colors.mutedForeground }]}
                    numberOfLines={1}
                  >
                    {objective.description}
                  </Text>
                )}
              </View>

              <Pressable onPress={() => onDelete(objective.id)} hitSlop={8}>
                <Trash2 size={18} color={colors.mutedForeground} />
              </Pressable>
            </Animated.View>
          ))}
        </View>
      )}

      {/* Add Input */}
      {showInput ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[styles.inputContainer, { backgroundColor: colors.card }, cardShadow]}
        >
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            value={newTitle}
            onChangeText={setNewTitle}
            placeholder={t('projects.objective.titlePlaceholder')}
            placeholderTextColor={colors.mutedForeground}
            autoFocus
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
          <View style={styles.inputActions}>
            <Pressable
              onPress={() => {
                setShowInput(false)
                setNewTitle('')
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
            {t('projects.objective.add')}
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
  list: {
    gap: spacing[2],
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: radius.lg,
    gap: spacing[3],
  },
  checkbox: {
    padding: spacing[0.5],
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    lineHeight: 20,
  },
  itemTitleDone: {
    textDecorationLine: 'line-through',
  },
  itemDescription: {
    fontSize: typography.size.xs,
    marginTop: 2,
  },
  inputContainer: {
    marginTop: spacing[3],
    padding: spacing[3],
    borderRadius: radius.lg,
  },
  input: {
    fontSize: typography.size.sm,
    paddingVertical: spacing[2],
  },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing[2],
    marginTop: spacing[2],
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
