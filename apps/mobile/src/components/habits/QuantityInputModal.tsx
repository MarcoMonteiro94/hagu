import { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Modal,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { X, Minus, Plus } from 'lucide-react-native'
import { useTheme, spacing, radius, typography } from '@/theme'

interface QuantityInputModalProps {
  visible: boolean
  onClose: () => void
  onSubmit: (value: number) => void
  habitTitle: string
  currentValue: number
  target: number
  unit: string
  color: string
}

export function QuantityInputModal({
  visible,
  onClose,
  onSubmit,
  habitTitle,
  currentValue,
  target,
  unit,
  color,
}: QuantityInputModalProps) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const [value, setValue] = useState(currentValue)

  useEffect(() => {
    if (visible) {
      setValue(currentValue)
    }
  }, [visible, currentValue])

  const handleIncrement = () => {
    setValue((prev) => Math.min(prev + 1, 9999))
  }

  const handleDecrement = () => {
    setValue((prev) => Math.max(prev - 1, 0))
  }

  const handleSubmit = () => {
    onSubmit(value)
    onClose()
  }

  const progress = target > 0 ? Math.min((value / target) * 100, 100) : 0
  const isComplete = value >= target

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.overlay}
        onPress={onClose}
      >
        <View
         
          style={[styles.container, { backgroundColor: colors.card }]}
        >
          <Pressable>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
                {habitTitle}
              </Text>
              <Pressable onPress={onClose} hitSlop={8}>
                <X size={24} color={colors.mutedForeground} />
              </Pressable>
            </View>

            {/* Progress Info */}
            <View style={styles.progressSection}>
              <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
                {t('habits.progress')}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: color,
                      width: `${progress}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
                {value} / {target} {unit}
              </Text>
            </View>

            {/* Value Input */}
            <View style={styles.inputSection}>
              <Pressable
                onPress={handleDecrement}
                disabled={value <= 0}
                style={[
                  styles.adjustButton,
                  { backgroundColor: colors.secondary },
                  value <= 0 && { opacity: 0.5 },
                ]}
              >
                <Minus size={24} color={colors.foreground} />
              </Pressable>

              <View style={styles.valueContainer}>
                <TextInput
                  style={[
                    styles.valueInput,
                    { color: colors.foreground, borderColor: color },
                  ]}
                  value={value.toString()}
                  onChangeText={(text) => {
                    const num = parseInt(text, 10)
                    if (!isNaN(num) && num >= 0 && num <= 9999) {
                      setValue(num)
                    } else if (text === '') {
                      setValue(0)
                    }
                  }}
                  keyboardType="numeric"
                  selectTextOnFocus
                />
                <Text style={[styles.unitText, { color: colors.mutedForeground }]}>
                  {unit}
                </Text>
              </View>

              <Pressable
                onPress={handleIncrement}
                disabled={value >= 9999}
                style={[
                  styles.adjustButton,
                  { backgroundColor: colors.secondary },
                  value >= 9999 && { opacity: 0.5 },
                ]}
              >
                <Plus size={24} color={colors.foreground} />
              </Pressable>
            </View>

            {/* Quick Add Buttons */}
            <View style={styles.quickAddRow}>
              {[1, 5, 10].map((amount) => (
                <Pressable
                  key={amount}
                  onPress={() => setValue((prev) => Math.min(prev + amount, 9999))}
                  style={[styles.quickAddButton, { backgroundColor: colors.secondary }]}
                >
                  <Text style={[styles.quickAddText, { color: colors.foreground }]}>
                    +{amount}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <Pressable
                onPress={onClose}
                style={[styles.button, styles.cancelButton, { backgroundColor: colors.secondary }]}
              >
                <Text style={[styles.buttonText, { color: colors.foreground }]}>
                  {t('common.cancel')}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                style={[
                  styles.button,
                  styles.submitButton,
                  { backgroundColor: isComplete ? colors.success : color },
                ]}
              >
                <Text style={[styles.buttonText, { color: colors.white }]}>
                  {isComplete ? t('habits.complete') : t('common.save')}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  container: {
    width: '100%',
    maxWidth: 360,
    borderRadius: radius['2xl'],
    padding: spacing[6],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[6],
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    flex: 1,
    marginRight: spacing[2],
  },
  progressSection: {
    marginBottom: spacing[6],
  },
  progressLabel: {
    fontSize: typography.size.sm,
    marginBottom: spacing[2],
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(128,128,128,0.2)',
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing[2],
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.full,
  },
  progressText: {
    fontSize: typography.size.sm,
    textAlign: 'center',
  },
  inputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[4],
    marginBottom: spacing[4],
  },
  adjustButton: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueContainer: {
    alignItems: 'center',
  },
  valueInput: {
    fontSize: typography.size['3xl'],
    fontWeight: typography.weight.bold,
    textAlign: 'center',
    minWidth: 100,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderWidth: 2,
    borderRadius: radius.lg,
  },
  unitText: {
    fontSize: typography.size.sm,
    marginTop: spacing[1],
  },
  quickAddRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[2],
    marginBottom: spacing[6],
  },
  quickAddButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.lg,
  },
  quickAddText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  button: {
    flex: 1,
    paddingVertical: spacing[3.5],
    borderRadius: radius.xl,
    alignItems: 'center',
  },
  cancelButton: {},
  submitButton: {},
  buttonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
})
