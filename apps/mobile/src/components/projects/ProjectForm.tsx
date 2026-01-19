import { useState, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  Alert,
  Platform,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { X, Calendar, Check } from 'lucide-react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useTheme, spacing, radius, typography } from '@/theme'
import { PROJECT_COLORS } from '@hagu/core'
import type { Project, CreateProjectData, UpdateProjectData } from '@hagu/core'

export interface ProjectFormData {
  title: string
  description?: string
  color: string
  dueDate?: string
}

interface ProjectFormProps {
  visible: boolean
  onClose: () => void
  onSubmit: (data: ProjectFormData) => void
  project?: Project | null
  isLoading?: boolean
}

export function ProjectForm({
  visible,
  onClose,
  onSubmit,
  project,
  isLoading = false,
}: ProjectFormProps) {
  const { t } = useTranslation()
  const { colors } = useTheme()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedColor, setSelectedColor] = useState<string>(PROJECT_COLORS[5]) // Default blue
  const [dueDate, setDueDate] = useState<Date | undefined>()
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [errors, setErrors] = useState<{ title?: string }>({})

  // Reset form when opening/closing or when project changes
  useEffect(() => {
    if (visible) {
      if (project) {
        setTitle(project.title)
        setDescription(project.description || '')
        setSelectedColor(project.color || PROJECT_COLORS[5])
        setDueDate(project.dueDate ? new Date(project.dueDate) : undefined)
      } else {
        setTitle('')
        setDescription('')
        setSelectedColor(PROJECT_COLORS[5])
        setDueDate(undefined)
      }
      setErrors({})
    }
  }, [visible, project])

  const validate = useCallback(() => {
    const newErrors: { title?: string } = {}

    if (!title.trim()) {
      newErrors.title = t('projects.form.titleRequired')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [title, t])

  const handleSubmit = useCallback(() => {
    if (!validate()) return

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      color: selectedColor,
      dueDate: dueDate?.toISOString().split('T')[0],
    })
  }, [title, description, selectedColor, dueDate, validate, onSubmit])

  const handleDateChange = useCallback(
    (_event: unknown, selectedDate?: Date) => {
      if (Platform.OS === 'android') {
        setShowDatePicker(false)
      }
      if (selectedDate) {
        setDueDate(selectedDate)
      }
    },
    []
  )

  const clearDate = useCallback(() => {
    setDueDate(undefined)
  }, [])

  const isEditing = !!project

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.overlay}>
        <View
         
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={24} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              {isEditing ? t('projects.editProject') : t('projects.addProject')}
            </Text>
            <Pressable
              onPress={handleSubmit}
              disabled={isLoading}
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.saveButtonText}>
                {isLoading ? t('common.loading') : t('common.save')}
              </Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Title */}
            <View>
              <Text style={[styles.label, { color: colors.foreground }]}>
                {t('projects.form.titleLabel')} *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border },
                  errors.title && { borderColor: colors.error },
                ]}
                value={title}
                onChangeText={setTitle}
                placeholder={t('projects.form.titlePlaceholder')}
                placeholderTextColor={colors.mutedForeground}
                autoFocus
              />
              {errors.title && (
                <Text style={[styles.errorText, { color: colors.error }]}>{errors.title}</Text>
              )}
            </View>

            {/* Description */}
            <View>
              <Text style={[styles.label, { color: colors.foreground }]}>
                {t('projects.form.descriptionLabel')}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border },
                ]}
                value={description}
                onChangeText={setDescription}
                placeholder={t('projects.form.descriptionPlaceholder')}
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Color picker */}
            <View>
              <Text style={[styles.label, { color: colors.foreground }]}>
                {t('projects.form.colorLabel')}
              </Text>
              <View style={styles.colorGrid}>
                {PROJECT_COLORS.map((color) => (
                  <Pressable
                    key={color}
                    onPress={() => setSelectedColor(color)}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      selectedColor === color && styles.colorOptionSelected,
                    ]}
                  >
                    {selectedColor === color && <Check size={16} color="#fff" />}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Due Date */}
            <View>
              <Text style={[styles.label, { color: colors.foreground }]}>
                {t('projects.form.dueDateLabel')}
              </Text>
              <Pressable
                onPress={() => setShowDatePicker(true)}
                style={[styles.dateButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Calendar size={18} color={colors.mutedForeground} />
                <Text
                  style={[
                    styles.dateText,
                    { color: dueDate ? colors.foreground : colors.mutedForeground },
                  ]}
                >
                  {dueDate
                    ? dueDate.toLocaleDateString()
                    : t('projects.form.selectDate')}
                </Text>
                {dueDate && (
                  <Pressable onPress={clearDate} hitSlop={8}>
                    <X size={16} color={colors.mutedForeground} />
                  </Pressable>
                )}
              </Pressable>
            </View>

            {showDatePicker && (
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={dueDate || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
                {Platform.OS === 'ios' && (
                  <Pressable
                    onPress={() => setShowDatePicker(false)}
                    style={[styles.datePickerDone, { backgroundColor: colors.primary }]}
                  >
                    <Text style={styles.datePickerDoneText}>{t('common.confirm')}</Text>
                  </Pressable>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
  saveButton: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.md,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
    gap: spacing[5],
  },
  label: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    marginBottom: spacing[2],
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    fontSize: typography.size.base,
  },
  textArea: {
    minHeight: 80,
  },
  errorText: {
    fontSize: typography.size.xs,
    marginTop: spacing[1],
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorOptionSelected: {
    transform: [{ scale: 1.1 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  dateText: {
    flex: 1,
    fontSize: typography.size.base,
  },
  datePickerContainer: {
    marginTop: spacing[2],
  },
  datePickerDone: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.md,
    marginTop: spacing[2],
  },
  datePickerDoneText: {
    color: '#fff',
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
})
