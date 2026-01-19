import { useState, useCallback } from 'react'
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  ScrollView,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { SafeAreaModalFooter } from '../shared'
import {
  X,
  Check,
  ArrowUpDown,
  Filter,
  Calendar,
  Flag,
  Clock,
  SortAsc,
  SortDesc,
} from 'lucide-react-native'
import { useTheme, spacing, radius, typography } from '@/theme'
import type { TaskStatus, TaskPriority } from '@hagu/core'

export type SortField = 'dueDate' | 'priority' | 'createdAt' | 'title' | 'status'
export type SortDirection = 'asc' | 'desc'

export interface TaskFilters {
  status?: TaskStatus[]
  priority?: TaskPriority[]
  hasDueDate?: boolean
  isOverdue?: boolean
}

export interface TaskSorting {
  field: SortField
  direction: SortDirection
}

interface TaskFilterSheetProps {
  visible: boolean
  onClose: () => void
  filters: TaskFilters
  sorting: TaskSorting
  onFiltersChange: (filters: TaskFilters) => void
  onSortingChange: (sorting: TaskSorting) => void
  onReset: () => void
}

const STATUS_OPTIONS: TaskStatus[] = ['pending', 'in_progress', 'done']
const PRIORITY_OPTIONS: TaskPriority[] = ['urgent', 'high', 'medium', 'low']
const SORT_FIELDS: SortField[] = ['dueDate', 'priority', 'createdAt', 'title', 'status']

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#f97316',
  urgent: '#ef4444',
}

export function TaskFilterSheet({
  visible,
  onClose,
  filters,
  sorting,
  onFiltersChange,
  onSortingChange,
  onReset,
}: TaskFilterSheetProps) {
  const { t } = useTranslation()
  const { colors } = useTheme()

  const toggleStatus = useCallback(
    (status: TaskStatus) => {
      const current = filters.status || []
      const newStatus = current.includes(status)
        ? current.filter((s) => s !== status)
        : [...current, status]
      onFiltersChange({
        ...filters,
        status: newStatus.length > 0 ? newStatus : undefined,
      })
    },
    [filters, onFiltersChange]
  )

  const togglePriority = useCallback(
    (priority: TaskPriority) => {
      const current = filters.priority || []
      const newPriority = current.includes(priority)
        ? current.filter((p) => p !== priority)
        : [...current, priority]
      onFiltersChange({
        ...filters,
        priority: newPriority.length > 0 ? newPriority : undefined,
      })
    },
    [filters, onFiltersChange]
  )

  const toggleDueDateFilter = useCallback(
    (value: boolean | undefined) => {
      onFiltersChange({
        ...filters,
        hasDueDate: filters.hasDueDate === value ? undefined : value,
      })
    },
    [filters, onFiltersChange]
  )

  const toggleOverdueFilter = useCallback(() => {
    onFiltersChange({
      ...filters,
      isOverdue: !filters.isOverdue,
    })
  }, [filters, onFiltersChange])

  const handleSortFieldChange = useCallback(
    (field: SortField) => {
      if (sorting.field === field) {
        // Toggle direction
        onSortingChange({
          ...sorting,
          direction: sorting.direction === 'asc' ? 'desc' : 'asc',
        })
      } else {
        onSortingChange({
          field,
          direction: 'asc',
        })
      }
    },
    [sorting, onSortingChange]
  )

  const hasActiveFilters =
    (filters.status && filters.status.length > 0) ||
    (filters.priority && filters.priority.length > 0) ||
    filters.hasDueDate !== undefined ||
    filters.isOverdue

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalBackdrop} />
      </Pressable>

      <View
       
        style={[styles.modalContent, { backgroundColor: colors.background }]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} style={styles.headerButton}>
            <X size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {t('tasks.filterSort.title')}
          </Text>
          {hasActiveFilters ? (
            <Pressable onPress={onReset} style={styles.headerButton}>
              <Text style={[styles.resetText, { color: colors.accent }]}>
                {t('tasks.filterSort.reset')}
              </Text>
            </Pressable>
          ) : (
            <View style={styles.headerButton} />
          )}
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Sort Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ArrowUpDown size={18} color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {t('tasks.filterSort.sortBy')}
              </Text>
            </View>
            <View style={styles.optionsGrid}>
              {SORT_FIELDS.map((field) => {
                const isSelected = sorting.field === field
                return (
                  <Pressable
                    key={field}
                    onPress={() => handleSortFieldChange(field)}
                    style={[
                      styles.sortOption,
                      {
                        backgroundColor: isSelected ? colors.accent + '15' : colors.secondary,
                        borderColor: isSelected ? colors.accent : 'transparent',
                      },
                    ]}
                  >
                    {isSelected &&
                      (sorting.direction === 'asc' ? (
                        <SortAsc size={14} color={colors.accent} />
                      ) : (
                        <SortDesc size={14} color={colors.accent} />
                      ))}
                    <Text
                      style={[
                        styles.optionText,
                        { color: isSelected ? colors.accent : colors.foreground },
                      ]}
                    >
                      {t(`tasks.filterSort.fields.${field}`)}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          {/* Status Filter */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={18} color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {t('tasks.status')}
              </Text>
            </View>
            <View style={styles.optionsRow}>
              {STATUS_OPTIONS.map((status) => {
                const isSelected = filters.status?.includes(status)
                return (
                  <Pressable
                    key={status}
                    onPress={() => toggleStatus(status)}
                    style={[
                      styles.statusOption,
                      {
                        backgroundColor: isSelected ? colors.accent + '15' : colors.secondary,
                        borderColor: isSelected ? colors.accent : 'transparent',
                      },
                    ]}
                  >
                    {isSelected && <Check size={14} color={colors.accent} />}
                    <Text
                      style={[
                        styles.optionText,
                        { color: isSelected ? colors.accent : colors.foreground },
                      ]}
                    >
                      {t(`tasks.${status}`)}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          {/* Priority Filter */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Flag size={18} color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {t('tasks.priority')}
              </Text>
            </View>
            <View style={styles.optionsRow}>
              {PRIORITY_OPTIONS.map((priority) => {
                const isSelected = filters.priority?.includes(priority)
                const priorityColor = PRIORITY_COLORS[priority]
                return (
                  <Pressable
                    key={priority}
                    onPress={() => togglePriority(priority)}
                    style={[
                      styles.priorityOption,
                      {
                        backgroundColor: isSelected ? priorityColor + '20' : colors.secondary,
                        borderColor: isSelected ? priorityColor : 'transparent',
                      },
                    ]}
                  >
                    {isSelected && <Check size={14} color={priorityColor} />}
                    <Text
                      style={[
                        styles.optionText,
                        { color: isSelected ? priorityColor : colors.foreground },
                      ]}
                    >
                      {t(`tasks.${priority}`)}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          {/* Due Date Filter */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Calendar size={18} color={colors.accent} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {t('tasks.dueDate')}
              </Text>
            </View>
            <View style={styles.optionsRow}>
              <Pressable
                onPress={() => toggleDueDateFilter(true)}
                style={[
                  styles.dateOption,
                  {
                    backgroundColor:
                      filters.hasDueDate === true ? colors.accent + '15' : colors.secondary,
                    borderColor: filters.hasDueDate === true ? colors.accent : 'transparent',
                  },
                ]}
              >
                {filters.hasDueDate === true && <Check size={14} color={colors.accent} />}
                <Text
                  style={[
                    styles.optionText,
                    { color: filters.hasDueDate === true ? colors.accent : colors.foreground },
                  ]}
                >
                  {t('tasks.filterSort.withDueDate')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => toggleDueDateFilter(false)}
                style={[
                  styles.dateOption,
                  {
                    backgroundColor:
                      filters.hasDueDate === false ? colors.accent + '15' : colors.secondary,
                    borderColor: filters.hasDueDate === false ? colors.accent : 'transparent',
                  },
                ]}
              >
                {filters.hasDueDate === false && <Check size={14} color={colors.accent} />}
                <Text
                  style={[
                    styles.optionText,
                    { color: filters.hasDueDate === false ? colors.accent : colors.foreground },
                  ]}
                >
                  {t('tasks.filterSort.withoutDueDate')}
                </Text>
              </Pressable>
              <Pressable
                onPress={toggleOverdueFilter}
                style={[
                  styles.dateOption,
                  {
                    backgroundColor: filters.isOverdue ? colors.error + '15' : colors.secondary,
                    borderColor: filters.isOverdue ? colors.error : 'transparent',
                  },
                ]}
              >
                {filters.isOverdue && <Check size={14} color={colors.error} />}
                <Text
                  style={[
                    styles.optionText,
                    { color: filters.isOverdue ? colors.error : colors.foreground },
                  ]}
                >
                  {t('tasks.filterSort.overdue')}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        {/* Apply Button */}
        <SafeAreaModalFooter style={[styles.footer, { borderTopColor: colors.border }]}>
          <Pressable
            onPress={onClose}
            style={[styles.applyButton, { backgroundColor: colors.accent }]}
          >
            <Filter size={18} color={colors.white} />
            <Text style={[styles.applyButtonText, { color: colors.white }]}>
              {t('tasks.filterSort.apply')}
            </Text>
          </Pressable>
        </SafeAreaModalFooter>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
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
    maxHeight: '85%',
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
    minWidth: 60,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
  resetText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[6],
    gap: spacing[6],
  },
  section: {
    gap: spacing[3],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  sectionTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2.5],
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2.5],
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  priorityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2.5],
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  dateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2.5],
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  optionText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  footer: {
    borderTopWidth: 1,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3.5],
    borderRadius: radius.xl,
  },
  applyButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
})
