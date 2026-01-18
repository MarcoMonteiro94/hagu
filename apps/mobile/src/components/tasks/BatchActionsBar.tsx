import { View, Text, Pressable, StyleSheet, Alert } from 'react-native'
import { useTranslation } from 'react-i18next'
import { X, CheckCircle2, Trash2, Clock } from 'lucide-react-native'
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated'
import { useTheme, spacing, radius, typography } from '@/theme'
import type { TaskStatus } from '@hagu/core'

interface BatchActionsBarProps {
  selectedCount: number
  onCancel: () => void
  onBatchComplete: () => void
  onBatchDelete: () => void
  onBatchSetStatus: (status: TaskStatus) => void
  isProcessing?: boolean
}

export function BatchActionsBar({
  selectedCount,
  onCancel,
  onBatchComplete,
  onBatchDelete,
  onBatchSetStatus,
  isProcessing,
}: BatchActionsBarProps) {
  const { t } = useTranslation()
  const { colors } = useTheme()

  const handleDelete = () => {
    Alert.alert(
      t('tasks.batch.deleteTitle'),
      t('tasks.batch.deleteConfirm', { count: selectedCount }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: onBatchDelete,
        },
      ]
    )
  }

  return (
    <Animated.View
      entering={SlideInDown.springify().damping(20)}
      exiting={SlideOutDown.springify().damping(20)}
      style={[styles.container, { backgroundColor: colors.card }]}
    >
      {/* Selection count */}
      <View style={styles.countSection}>
        <Pressable onPress={onCancel} style={styles.closeButton} hitSlop={8}>
          <X size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.countText, { color: colors.foreground }]}>
          {t('tasks.batch.selected', { count: selectedCount })}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actionsSection}>
        {/* Mark as In Progress */}
        <Pressable
          onPress={() => onBatchSetStatus('in_progress')}
          disabled={isProcessing}
          style={[styles.actionButton, { backgroundColor: colors.warning + '20' }]}
        >
          <Clock size={18} color={colors.warning} />
        </Pressable>

        {/* Mark as Complete */}
        <Pressable
          onPress={onBatchComplete}
          disabled={isProcessing}
          style={[styles.actionButton, { backgroundColor: colors.success + '20' }]}
        >
          <CheckCircle2 size={18} color={colors.success} />
        </Pressable>

        {/* Delete */}
        <Pressable
          onPress={handleDelete}
          disabled={isProcessing}
          style={[styles.actionButton, { backgroundColor: colors.error + '20' }]}
        >
          <Trash2 size={18} color={colors.error} />
        </Pressable>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[4],
    paddingBottom: spacing[8],
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  countSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  actionsSection: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
