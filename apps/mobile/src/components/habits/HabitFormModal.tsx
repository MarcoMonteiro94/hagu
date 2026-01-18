import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { X, Check } from 'lucide-react-native'
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated'
import { useTheme, spacing, radius, typography, pickerColors, getColorName } from '@/theme'
import { useAreasQuery } from '@/hooks/use-areas'
import { useCreateHabit, useUpdateHabit } from '@/hooks/use-habits'
import type { Habit, HabitFrequency, HabitTracking, LifeArea } from '@hagu/core'

// Days of week for specific days selection
const DAYS_OF_WEEK = [0, 1, 2, 3, 4, 5, 6] as const

type FrequencyType = 'daily' | 'weekly' | 'specificDays' | 'monthly'
type TrackingType = 'boolean' | 'quantitative'

interface HabitFormModalProps {
  visible: boolean
  onClose: () => void
  habit?: Habit // If provided, edit mode
  defaultAreaId?: string
}

function getInitialFrequencyType(habit?: Habit): FrequencyType {
  return habit?.frequency.type || 'daily'
}

function getInitialDaysPerWeek(habit?: Habit): number {
  return habit?.frequency.type === 'weekly' ? habit.frequency.daysPerWeek : 3
}

function getInitialSpecificDays(habit?: Habit): number[] {
  return habit?.frequency.type === 'specificDays' ? habit.frequency.days : [1, 3, 5]
}

function getInitialTimesPerMonth(habit?: Habit): number {
  return habit?.frequency.type === 'monthly' ? habit.frequency.timesPerMonth : 10
}

function getInitialTarget(habit?: Habit): number {
  return habit?.tracking.type === 'quantitative' ? habit.tracking.target : 1
}

function getInitialUnit(habit?: Habit): string {
  return habit?.tracking.type === 'quantitative' ? habit.tracking.unit : ''
}

export function HabitFormModal({
  visible,
  onClose,
  habit,
  defaultAreaId,
}: HabitFormModalProps) {
  const { t } = useTranslation()
  const { colors } = useTheme()

  const { data: areas = [] } = useAreasQuery()
  const createHabit = useCreateHabit()
  const updateHabit = useUpdateHabit()

  const isEditing = !!habit

  // Form state
  const [title, setTitle] = useState(habit?.title || '')
  const [description, setDescription] = useState(habit?.description || '')
  const [areaId, setAreaId] = useState(habit?.areaId || defaultAreaId || '')
  const [color, setColor] = useState(habit?.color || pickerColors[3])

  // Frequency state
  const [frequencyType, setFrequencyType] = useState<FrequencyType>(
    getInitialFrequencyType(habit)
  )
  const [daysPerWeek, setDaysPerWeek] = useState(getInitialDaysPerWeek(habit))
  const [specificDays, setSpecificDays] = useState<number[]>(getInitialSpecificDays(habit))
  const [timesPerMonth, setTimesPerMonth] = useState(getInitialTimesPerMonth(habit))

  // Tracking state
  const [trackingType, setTrackingType] = useState<TrackingType>(
    habit?.tracking.type || 'boolean'
  )
  const [target, setTarget] = useState(getInitialTarget(habit))
  const [unit, setUnit] = useState(getInitialUnit(habit))

  // Update areaId when areas first load if we started with empty value
  useEffect(() => {
    if (areas.length > 0 && !areaId) {
      setAreaId(areas[0].id)
    }
  }, [areas, areaId])

  // Reset form when modal opens/closes or habit changes
  useEffect(() => {
    if (visible) {
      if (habit) {
        setTitle(habit.title)
        setDescription(habit.description || '')
        setAreaId(habit.areaId)
        setColor(habit.color)
        setFrequencyType(getInitialFrequencyType(habit))
        setDaysPerWeek(getInitialDaysPerWeek(habit))
        setSpecificDays(getInitialSpecificDays(habit))
        setTimesPerMonth(getInitialTimesPerMonth(habit))
        setTrackingType(habit.tracking.type)
        setTarget(getInitialTarget(habit))
        setUnit(getInitialUnit(habit))
      } else {
        setTitle('')
        setDescription('')
        setAreaId(defaultAreaId || areas[0]?.id || '')
        setColor(pickerColors[3])
        setFrequencyType('daily')
        setDaysPerWeek(3)
        setSpecificDays([1, 3, 5])
        setTimesPerMonth(10)
        setTrackingType('boolean')
        setTarget(1)
        setUnit('')
      }
    }
  }, [visible, habit, defaultAreaId, areas])

  const toggleSpecificDay = useCallback((day: number) => {
    setSpecificDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }, [])

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert(t('common.error'), t('habits.titleRequired'))
      return
    }

    if (!areaId || !areas.some((a) => a.id === areaId)) {
      Alert.alert(t('common.error'), t('habits.areaRequired'))
      return
    }

    // Build frequency object
    let frequency: HabitFrequency
    switch (frequencyType) {
      case 'daily':
        frequency = { type: 'daily' }
        break
      case 'weekly':
        frequency = { type: 'weekly', daysPerWeek }
        break
      case 'specificDays':
        frequency = { type: 'specificDays', days: specificDays }
        break
      case 'monthly':
        frequency = { type: 'monthly', timesPerMonth }
        break
    }

    // Build tracking object
    let tracking: HabitTracking
    if (trackingType === 'boolean') {
      tracking = { type: 'boolean' }
    } else {
      tracking = { type: 'quantitative', target, unit }
    }

    try {
      if (isEditing && habit) {
        await updateHabit.mutateAsync({
          id: habit.id,
          updates: {
            title: title.trim(),
            description: description.trim() || undefined,
            areaId,
            frequency,
            tracking,
            color,
          },
        })
      } else {
        await createHabit.mutateAsync({
          title: title.trim(),
          description: description.trim() || undefined,
          areaId,
          frequency,
          tracking,
          color,
        })
      }
      onClose()
    } catch (error) {
      const err = error as Error
      console.error('Failed to save habit:', err.message || err)
      Alert.alert(
        t('common.error'),
        isEditing ? t('habits.updateError') : t('habits.createError')
      )
    }
  }

  const isSubmitting = createHabit.isPending || updateHabit.isPending
  const isValid = title.trim().length > 0 && !!areaId

  const dayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] // Dom, Seg, Ter, Qua, Qui, Sex, Sab

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <Animated.View
          entering={SlideInDown.duration(300)}
          style={[styles.modalContainer, { backgroundColor: colors.background }]}
        >
          <SafeAreaView style={styles.safeArea} edges={['bottom']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Pressable onPress={onClose} style={styles.headerButton}>
                <X size={24} color={colors.foreground} />
              </Pressable>
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                {isEditing ? t('habits.editHabit') : t('habits.addNew')}
              </Text>
              <Pressable
                onPress={handleSubmit}
                disabled={!isValid || isSubmitting}
                style={[
                  styles.headerButton,
                  styles.saveButton,
                  { backgroundColor: isValid ? colors.accent : colors.muted },
                ]}
              >
                <Check size={20} color={colors.white} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Title Field */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.foreground }]}>
                  {t('habits.habitName')}
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
                  placeholder={t('habits.habitNamePlaceholder')}
                  placeholderTextColor={colors.mutedForeground}
                  autoFocus={!isEditing}
                />
              </View>

              {/* Description Field */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.foreground }]}>
                  {t('habits.habitDescription')}
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
                  placeholder={t('habits.descriptionPlaceholder')}
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
              </View>

              {/* Area Selection */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.foreground }]}>
                  {t('habits.area')}
                </Text>
                <View style={styles.chipsRow}>
                  {areas.map((area) => (
                    <Pressable
                      key={area.id}
                      onPress={() => setAreaId(area.id)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor:
                            areaId === area.id ? area.color : colors.secondary,
                          borderColor: areaId === area.id ? area.color : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: areaId === area.id ? colors.white : colors.foreground,
                          },
                        ]}
                      >
                        {area.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Color Selection */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.foreground }]}>
                  {t('habits.color')}
                </Text>
                <View style={styles.colorRow}>
                  {pickerColors.map((c) => (
                    <Pressable
                      key={c}
                      onPress={() => setColor(c)}
                      accessibilityLabel={getColorName(c)}
                      style={[
                        styles.colorButton,
                        { backgroundColor: c },
                        color === c && styles.colorButtonSelected,
                      ]}
                    >
                      {color === c && <Check size={16} color={colors.white} />}
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Frequency Selection */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.foreground }]}>
                  {t('habits.frequency')}
                </Text>
                <View style={styles.tabsContainer}>
                  <View style={styles.tabsRow}>
                    {(['daily', 'weekly'] as const).map((type) => (
                      <Pressable
                        key={type}
                        onPress={() => setFrequencyType(type)}
                        style={[
                          styles.tab,
                          {
                            backgroundColor:
                              frequencyType === type ? colors.primary : colors.secondary,
                            borderColor:
                              frequencyType === type ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.tabText,
                            {
                              color:
                                frequencyType === type
                                  ? colors.primaryForeground
                                  : colors.foreground,
                            },
                          ]}
                        >
                          {t(`habits.frequency${type.charAt(0).toUpperCase() + type.slice(1)}`)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={styles.tabsRow}>
                    {(['specificDays', 'monthly'] as const).map((type) => (
                      <Pressable
                        key={type}
                        onPress={() => setFrequencyType(type)}
                        style={[
                          styles.tab,
                          {
                            backgroundColor:
                              frequencyType === type ? colors.primary : colors.secondary,
                            borderColor:
                              frequencyType === type ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.tabText,
                            {
                              color:
                                frequencyType === type
                                  ? colors.primaryForeground
                                  : colors.foreground,
                            },
                          ]}
                        >
                          {t(
                            `habits.frequency${type.charAt(0).toUpperCase() + type.slice(1)}`
                          )}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Frequency Options */}
                {frequencyType === 'weekly' && (
                  <View style={styles.frequencyOptions}>
                    <Text style={[styles.optionLabel, { color: colors.mutedForeground }]}>
                      {t('habits.timesPerWeek')}
                    </Text>
                    <View style={styles.numberInputRow}>
                      <Pressable
                        onPress={() => setDaysPerWeek(Math.max(1, daysPerWeek - 1))}
                        style={[styles.numberButton, { backgroundColor: colors.secondary }]}
                      >
                        <Text style={[styles.numberButtonText, { color: colors.foreground }]}>
                          -
                        </Text>
                      </Pressable>
                      <Text style={[styles.numberValue, { color: colors.foreground }]}>
                        {daysPerWeek}
                      </Text>
                      <Pressable
                        onPress={() => setDaysPerWeek(Math.min(7, daysPerWeek + 1))}
                        style={[styles.numberButton, { backgroundColor: colors.secondary }]}
                      >
                        <Text style={[styles.numberButtonText, { color: colors.foreground }]}>
                          +
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}

                {frequencyType === 'specificDays' && (
                  <View style={styles.frequencyOptions}>
                    <Text style={[styles.optionLabel, { color: colors.mutedForeground }]}>
                      {t('habits.selectDays')}
                    </Text>
                    <View style={styles.daysRow}>
                      {DAYS_OF_WEEK.map((day) => (
                        <Pressable
                          key={day}
                          onPress={() => toggleSpecificDay(day)}
                          style={[
                            styles.dayButton,
                            {
                              backgroundColor: specificDays.includes(day)
                                ? colors.primary
                                : colors.secondary,
                              borderColor: specificDays.includes(day)
                                ? colors.primary
                                : colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayButtonText,
                              {
                                color: specificDays.includes(day)
                                  ? colors.primaryForeground
                                  : colors.foreground,
                              },
                            ]}
                          >
                            {dayLabels[day]}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}

                {frequencyType === 'monthly' && (
                  <View style={styles.frequencyOptions}>
                    <Text style={[styles.optionLabel, { color: colors.mutedForeground }]}>
                      {t('habits.timesPerMonth')}
                    </Text>
                    <View style={styles.numberInputRow}>
                      <Pressable
                        onPress={() => setTimesPerMonth(Math.max(1, timesPerMonth - 1))}
                        style={[styles.numberButton, { backgroundColor: colors.secondary }]}
                      >
                        <Text style={[styles.numberButtonText, { color: colors.foreground }]}>
                          -
                        </Text>
                      </Pressable>
                      <Text style={[styles.numberValue, { color: colors.foreground }]}>
                        {timesPerMonth}
                      </Text>
                      <Pressable
                        onPress={() => setTimesPerMonth(Math.min(31, timesPerMonth + 1))}
                        style={[styles.numberButton, { backgroundColor: colors.secondary }]}
                      >
                        <Text style={[styles.numberButtonText, { color: colors.foreground }]}>
                          +
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>

              {/* Tracking Type Selection */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.foreground }]}>
                  {t('habits.trackingType')}
                </Text>
                <View style={styles.tabsRow}>
                  <Pressable
                    onPress={() => setTrackingType('boolean')}
                    style={[
                      styles.tab,
                      {
                        backgroundColor:
                          trackingType === 'boolean' ? colors.primary : colors.secondary,
                        borderColor:
                          trackingType === 'boolean' ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        {
                          color:
                            trackingType === 'boolean'
                              ? colors.primaryForeground
                              : colors.foreground,
                        },
                      ]}
                    >
                      {t('habits.trackingBoolean')}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setTrackingType('quantitative')}
                    style={[
                      styles.tab,
                      {
                        backgroundColor:
                          trackingType === 'quantitative'
                            ? colors.primary
                            : colors.secondary,
                        borderColor:
                          trackingType === 'quantitative' ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        {
                          color:
                            trackingType === 'quantitative'
                              ? colors.primaryForeground
                              : colors.foreground,
                        },
                      ]}
                    >
                      {t('habits.trackingQuantitative')}
                    </Text>
                  </Pressable>
                </View>

                {/* Quantitative Options */}
                {trackingType === 'quantitative' && (
                  <View style={styles.quantitativeOptions}>
                    <View style={styles.quantitativeRow}>
                      <View style={styles.quantitativeField}>
                        <Text
                          style={[styles.optionLabel, { color: colors.mutedForeground }]}
                        >
                          {t('habits.target')}
                        </Text>
                        <TextInput
                          style={[
                            styles.quantitativeInput,
                            {
                              backgroundColor: colors.secondary,
                              color: colors.foreground,
                              borderColor: colors.border,
                            },
                          ]}
                          value={target.toString()}
                          onChangeText={(text) => setTarget(parseInt(text, 10) || 1)}
                          keyboardType="numeric"
                          placeholder="8"
                          placeholderTextColor={colors.mutedForeground}
                        />
                      </View>
                      <View style={[styles.quantitativeField, { flex: 2 }]}>
                        <Text
                          style={[styles.optionLabel, { color: colors.mutedForeground }]}
                        >
                          {t('habits.unit')}
                        </Text>
                        <TextInput
                          style={[
                            styles.quantitativeInput,
                            {
                              backgroundColor: colors.secondary,
                              color: colors.foreground,
                              borderColor: colors.border,
                            },
                          ]}
                          value={unit}
                          onChangeText={setUnit}
                          placeholder={t('habits.unitPlaceholder')}
                          placeholderTextColor={colors.mutedForeground}
                        />
                      </View>
                    </View>
                  </View>
                )}
              </View>

              {/* Bottom padding */}
              <View style={{ height: spacing[8] }} />
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '92%',
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
  saveButton: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing[6],
    gap: spacing[6],
  },
  field: {
    gap: spacing[2],
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  input: {
    fontSize: typography.size.base,
    padding: spacing[3.5],
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 80,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  chip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2.5],
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  chipText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  colorRow: {
    flexDirection: 'row',
    gap: spacing[2],
    flexWrap: 'wrap',
  },
  colorButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorButtonSelected: {
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  tabsContainer: {
    gap: spacing[2],
  },
  tabsRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  tab: {
    flex: 1,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  tabText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  frequencyOptions: {
    marginTop: spacing[3],
    gap: spacing[2],
  },
  optionLabel: {
    fontSize: typography.size.sm,
  },
  numberInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  numberButton: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberButtonText: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.medium,
  },
  numberValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    minWidth: 30,
    textAlign: 'center',
  },
  daysRow: {
    flexDirection: 'row',
    gap: spacing[1.5],
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  dayButtonText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  quantitativeOptions: {
    marginTop: spacing[3],
  },
  quantitativeRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  quantitativeField: {
    flex: 1,
    gap: spacing[2],
  },
  quantitativeInput: {
    fontSize: typography.size.base,
    padding: spacing[3],
    borderRadius: radius.lg,
    borderWidth: 1,
  },
})
