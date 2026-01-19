import { useState, useCallback } from 'react'
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import {
  X,
  Repeat,
  Calendar,
  Check,
  ChevronUp,
  ChevronDown,
} from 'lucide-react-native'
import { useTheme, spacing, radius, typography } from '@/theme'
import type { RecurrencePattern } from '@hagu/core'

type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly'

interface RecurrencePickerProps {
  value?: RecurrencePattern
  onChange: (pattern: RecurrencePattern | undefined) => void
}

const RECURRENCE_TYPES: RecurrenceType[] = ['daily', 'weekly', 'monthly', 'yearly']

export function RecurrencePicker({ value, onChange }: RecurrencePickerProps) {
  const { t } = useTranslation()
  const { colors } = useTheme()

  const [showModal, setShowModal] = useState(false)
  const [selectedType, setSelectedType] = useState<RecurrenceType>(value?.type ?? 'daily')
  const [interval, setInterval] = useState(value?.interval ?? 1)

  const handleOpen = useCallback(() => {
    setSelectedType(value?.type ?? 'daily')
    setInterval(value?.interval ?? 1)
    setShowModal(true)
  }, [value])

  const handleSave = useCallback(() => {
    onChange({
      type: selectedType,
      interval,
    })
    setShowModal(false)
  }, [selectedType, interval, onChange])

  const handleClear = useCallback(() => {
    onChange(undefined)
    setShowModal(false)
  }, [onChange])

  const incrementInterval = useCallback(() => {
    setInterval((prev) => Math.min(prev + 1, 99))
  }, [])

  const decrementInterval = useCallback(() => {
    setInterval((prev) => Math.max(prev - 1, 1))
  }, [])

  const getRecurrenceLabel = (pattern: RecurrencePattern): string => {
    const { type, interval } = pattern
    if (interval === 1) {
      return t(`tasks.recurrence.every_${type}`)
    }
    return t(`tasks.recurrence.every_n_${type}s`, { count: interval })
  }

  return (
    <>
      <Pressable
        onPress={handleOpen}
        style={[
          styles.button,
          {
            backgroundColor: value ? colors.accent + '15' : colors.secondary,
            borderColor: value ? colors.accent : colors.border,
          },
        ]}
      >
        <Repeat size={18} color={value ? colors.accent : colors.mutedForeground} />
        <Text
          style={[
            styles.buttonText,
            { color: value ? colors.accent : colors.mutedForeground },
          ]}
        >
          {value ? getRecurrenceLabel(value) : t('tasks.recurrence.none')}
        </Text>
      </Pressable>

      <Modal
        visible={showModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowModal(false)}
        >
          <View
           
            style={styles.modalBackdrop}
          />
        </Pressable>

        <View
         
          style={[styles.modalContent, { backgroundColor: colors.background }]}
        >
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setShowModal(false)} style={styles.headerButton}>
              <X size={24} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {t('tasks.recurrence.title')}
            </Text>
            <View style={styles.headerButton} />
          </View>

          {/* Content */}
          <View style={styles.modalBody}>
            {/* Recurrence Type */}
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
              {t('tasks.recurrence.frequency')}
            </Text>
            <View style={styles.typeGrid}>
              {RECURRENCE_TYPES.map((type) => {
                const isSelected = selectedType === type
                return (
                  <Pressable
                    key={type}
                    onPress={() => setSelectedType(type)}
                    style={[
                      styles.typeButton,
                      {
                        backgroundColor: isSelected ? colors.accent + '15' : colors.secondary,
                        borderColor: isSelected ? colors.accent : colors.border,
                      },
                    ]}
                  >
                    {isSelected && (
                      <Check size={16} color={colors.accent} style={styles.typeCheck} />
                    )}
                    <Text
                      style={[
                        styles.typeText,
                        { color: isSelected ? colors.accent : colors.foreground },
                      ]}
                    >
                      {t(`tasks.recurrence.${type}`)}
                    </Text>
                  </Pressable>
                )
              })}
            </View>

            {/* Interval */}
            <Text style={[styles.sectionLabel, { color: colors.foreground, marginTop: spacing[5] }]}>
              {t('tasks.recurrence.interval')}
            </Text>
            <View style={styles.intervalRow}>
              <Text style={[styles.intervalLabel, { color: colors.mutedForeground }]}>
                {t('tasks.recurrence.every')}
              </Text>
              <View style={[styles.intervalControls, { backgroundColor: colors.secondary }]}>
                <Pressable
                  onPress={decrementInterval}
                  disabled={interval <= 1}
                  style={[
                    styles.intervalButton,
                    { opacity: interval <= 1 ? 0.4 : 1 },
                  ]}
                >
                  <ChevronDown size={20} color={colors.foreground} />
                </Pressable>
                <Text style={[styles.intervalValue, { color: colors.foreground }]}>
                  {interval}
                </Text>
                <Pressable
                  onPress={incrementInterval}
                  disabled={interval >= 99}
                  style={[
                    styles.intervalButton,
                    { opacity: interval >= 99 ? 0.4 : 1 },
                  ]}
                >
                  <ChevronUp size={20} color={colors.foreground} />
                </Pressable>
              </View>
              <Text style={[styles.intervalLabel, { color: colors.mutedForeground }]}>
                {interval === 1
                  ? t(`tasks.recurrence.${selectedType}`)
                  : t(`tasks.recurrence.${selectedType}s`)}
              </Text>
            </View>

            {/* Preview */}
            <View style={[styles.previewCard, { backgroundColor: colors.secondary }]}>
              <Calendar size={18} color={colors.accent} />
              <Text style={[styles.previewText, { color: colors.foreground }]}>
                {getRecurrenceLabel({ type: selectedType, interval })}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            {value && (
              <Pressable
                onPress={handleClear}
                style={[styles.footerButton, { backgroundColor: colors.error + '15' }]}
              >
                <Text style={[styles.footerButtonText, { color: colors.error }]}>
                  {t('tasks.recurrence.remove')}
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={handleSave}
              style={[
                styles.footerButton,
                styles.saveButton,
                { backgroundColor: colors.accent },
              ]}
            >
              <Text style={[styles.footerButtonText, { color: colors.white }]}>
                {t('common.save')}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    maxHeight: '80%',
  },
  modalHeader: {
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
  modalTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
  modalBody: {
    padding: spacing[6],
  },
  sectionLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    marginBottom: spacing[3],
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2.5],
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  typeCheck: {
    marginRight: spacing[1.5],
  },
  typeText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  intervalLabel: {
    fontSize: typography.size.sm,
  },
  intervalControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  intervalButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intervalValue: {
    width: 40,
    textAlign: 'center',
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius.lg,
    marginTop: spacing[5],
  },
  previewText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing[3],
    padding: spacing[6],
    paddingTop: spacing[4],
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[3.5],
    borderRadius: radius.xl,
  },
  saveButton: {},
  footerButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
})
