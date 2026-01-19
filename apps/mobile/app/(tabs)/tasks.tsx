import { useState, useMemo, useCallback, useEffect } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl, Alert } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { router } from 'expo-router'
import {
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Filter,
  SlidersHorizontal,
} from 'lucide-react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useTheme, cardShadow, spacing, radius, typography } from '@/theme'
import {
  TaskCard,
  TaskFilterSheet,
  BatchActionsBar,
  type TaskFilters,
  type TaskSorting,
  type SortField,
} from '@/components/tasks'
import {
  useTasksQuery,
  useTaskStats,
  useUpdateTaskStatus,
  useDeleteManyTasks,
  useUpdateManyTasksStatus,
} from '@/hooks'
import type { Task, TaskStatus, TaskPriority } from '@hagu/core'

type FilterType = 'all' | TaskStatus

const STORAGE_KEY = '@hagu/task-preferences'

const DEFAULT_SORTING: TaskSorting = {
  field: 'status',
  direction: 'asc',
}

const DEFAULT_FILTERS: TaskFilters = {}

interface FilterChipProps {
  label: string
  active?: boolean
  onPress?: () => void
}

function FilterChip({ label, active, onPress }: FilterChipProps) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.filterChip,
        {
          backgroundColor: active ? colors.primary : colors.secondary,
        },
      ]}
    >
      <Text
        style={[
          styles.filterChipText,
          { color: active ? colors.primaryForeground : colors.mutedForeground },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  )
}

interface StatMiniCardProps {
  value: number
  label: string
  icon: React.ReactNode
  iconBgColor: string
  delay: number
}

function StatMiniCard({ value, label, icon, iconBgColor, delay }: StatMiniCardProps) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <View
     
      style={[styles.statMiniCard, { backgroundColor: colors.card }, cardShadow]}
    >
      <View style={[styles.statMiniIcon, { backgroundColor: iconBgColor }]}>
        {icon}
      </View>
      <Text style={[styles.statMiniValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statMiniLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.accent + '15' }]}>
        <CheckCircle2 size={48} color={colors.accent} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        {t('tasks.noTasks')}
      </Text>
      <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
        {t('tasks.emptyDescription')}
      </Text>
      <Pressable
        onPress={onAdd}
        style={[styles.emptyButton, { backgroundColor: colors.accent }]}
      >
        <Plus size={20} color={colors.white} />
        <Text style={styles.emptyButtonText}>{t('tasks.addTask')}</Text>
      </Pressable>
    </View>
  )
}

function isOverdue(dueDate: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return due < today
}

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
}

const STATUS_ORDER: Record<TaskStatus, number> = {
  pending: 0,
  in_progress: 1,
  done: 2,
}

export default function TasksScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const [quickFilter, setQuickFilter] = useState<FilterType>('all')
  const [showFilterSheet, setShowFilterSheet] = useState(false)
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS)
  const [sorting, setSorting] = useState<TaskSorting>(DEFAULT_SORTING)

  // Selection mode state
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const { data: tasks, isLoading, refetch } = useTasksQuery()
  const stats = useTaskStats(tasks)
  const updateStatus = useUpdateTaskStatus()
  const deleteManyTasks = useDeleteManyTasks()
  const updateManyStatus = useUpdateManyTasksStatus()

  // Load saved preferences
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved) {
        try {
          const { filters: savedFilters, sorting: savedSorting } = JSON.parse(saved)
          if (savedFilters) setFilters(savedFilters)
          if (savedSorting) setSorting(savedSorting)
        } catch {
          // Ignore invalid saved data
        }
      }
    })
  }, [])

  // Save preferences
  useEffect(() => {
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ filters, sorting })
    )
  }, [filters, sorting])

  // Apply filters
  const filteredTasks = useMemo(() => {
    if (!tasks) return []

    let result = [...tasks]

    // Apply quick filter first
    if (quickFilter !== 'all') {
      result = result.filter((task) => task.status === quickFilter)
    }

    // Apply advanced filters
    if (filters.status && filters.status.length > 0) {
      result = result.filter((task) => filters.status!.includes(task.status))
    }

    if (filters.priority && filters.priority.length > 0) {
      result = result.filter(
        (task) => task.priority && filters.priority!.includes(task.priority)
      )
    }

    if (filters.hasDueDate === true) {
      result = result.filter((task) => !!task.dueDate)
    } else if (filters.hasDueDate === false) {
      result = result.filter((task) => !task.dueDate)
    }

    if (filters.isOverdue) {
      result = result.filter(
        (task) => task.dueDate && task.status !== 'done' && isOverdue(task.dueDate)
      )
    }

    return result
  }, [tasks, quickFilter, filters])

  // Apply sorting
  const sortedTasks = useMemo(() => {
    const result = [...filteredTasks]

    result.sort((a, b) => {
      let comparison = 0

      switch (sorting.field) {
        case 'dueDate': {
          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER
          comparison = aDate - bDate
          break
        }
        case 'priority': {
          const aPriority = a.priority ? PRIORITY_ORDER[a.priority] : 999
          const bPriority = b.priority ? PRIORITY_ORDER[b.priority] : 999
          comparison = aPriority - bPriority
          break
        }
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'status':
          comparison = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
          break
      }

      return sorting.direction === 'desc' ? -comparison : comparison
    })

    return result
  }, [filteredTasks, sorting])

  const pendingCount = stats.pending + stats.inProgress

  const hasActiveFilters = useMemo(() => {
    return (
      (filters.status && filters.status.length > 0) ||
      (filters.priority && filters.priority.length > 0) ||
      filters.hasDueDate !== undefined ||
      filters.isOverdue
    )
  }, [filters])

  const handleAddTask = useCallback(() => {
    router.push('/task/new')
  }, [])

  const handleTaskPress = useCallback((task: Task) => {
    router.push(`/task/${task.id}`)
  }, [])

  const handleToggleStatus = useCallback(
    (id: string, status: TaskStatus) => {
      updateStatus.mutate({ id, status })
    },
    [updateStatus]
  )

  const handleQuickFilterPress = useCallback((newFilter: FilterType) => {
    setQuickFilter(newFilter)
  }, [])

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    setSorting(DEFAULT_SORTING)
  }, [])

  // Selection handlers
  const handleSelectTask = useCallback((task: Task) => {
    if (!selectionMode) {
      // Enter selection mode on first long press
      setSelectionMode(true)
      setSelectedIds(new Set([task.id]))
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (next.has(task.id)) {
          next.delete(task.id)
        } else {
          next.add(task.id)
        }
        // Exit selection mode if nothing selected
        if (next.size === 0) {
          setSelectionMode(false)
        }
        return next
      })
    }
  }, [selectionMode])

  const handleCancelSelection = useCallback(() => {
    setSelectionMode(false)
    setSelectedIds(new Set())
  }, [])

  const handleBatchComplete = useCallback(async () => {
    const ids = Array.from(selectedIds)
    try {
      await updateManyStatus.mutateAsync({ ids, status: 'done' })
      handleCancelSelection()
    } catch (error) {
      Alert.alert(t('common.error'), t('tasks.batch.error'))
    }
  }, [selectedIds, updateManyStatus, handleCancelSelection, t])

  const handleBatchDelete = useCallback(async () => {
    const ids = Array.from(selectedIds)
    try {
      await deleteManyTasks.mutateAsync(ids)
      handleCancelSelection()
    } catch (error) {
      Alert.alert(t('common.error'), t('tasks.batch.error'))
    }
  }, [selectedIds, deleteManyTasks, handleCancelSelection, t])

  const handleBatchSetStatus = useCallback(async (status: TaskStatus) => {
    const ids = Array.from(selectedIds)
    try {
      await updateManyStatus.mutateAsync({ ids, status })
      handleCancelSelection()
    } catch (error) {
      Alert.alert(t('common.error'), t('tasks.batch.error'))
    }
  }, [selectedIds, updateManyStatus, handleCancelSelection, t])

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, spacing[8]) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.accent}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {t('tasks.title')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {pendingCount} {pendingCount === 1 ? t('tasks.taskPending') : t('tasks.tasksPending')}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setShowFilterSheet(true)}
              style={[
                styles.iconButton,
                {
                  backgroundColor: hasActiveFilters ? colors.accent + '20' : colors.secondary,
                  borderColor: hasActiveFilters ? colors.accent : 'transparent',
                  borderWidth: 1,
                },
              ]}
            >
              <SlidersHorizontal
                size={20}
                color={hasActiveFilters ? colors.accent : colors.mutedForeground}
              />
            </Pressable>
            <Pressable
              onPress={handleAddTask}
              style={[styles.iconButtonPrimary, { backgroundColor: colors.accent }]}
            >
              <Plus size={22} color={colors.white} />
            </Pressable>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatMiniCard
            value={stats.pending}
            label={t('tasks.pending')}
            icon={<Clock size={16} color={colors.warning} />}
            iconBgColor={colors.warning + '20'}
            delay={100}
          />
          <StatMiniCard
            value={stats.inProgress}
            label={t('tasks.inProgress')}
            icon={<Circle size={16} color={colors.info} />}
            iconBgColor={colors.info + '20'}
            delay={150}
          />
          <StatMiniCard
            value={stats.done}
            label={t('tasks.done')}
            icon={<CheckCircle2 size={16} color={colors.success} />}
            iconBgColor={colors.success + '20'}
            delay={200}
          />
        </View>

        {/* Quick Filters */}
        <View style={styles.filtersContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.filtersContent, { paddingBottom: Math.max(insets.bottom, spacing[8]) }]}
          >
            <FilterChip
              label={t('tasks.all')}
              active={quickFilter === 'all'}
              onPress={() => handleQuickFilterPress('all')}
            />
            <FilterChip
              label={t('tasks.pending')}
              active={quickFilter === 'pending'}
              onPress={() => handleQuickFilterPress('pending')}
            />
            <FilterChip
              label={t('tasks.inProgress')}
              active={quickFilter === 'in_progress'}
              onPress={() => handleQuickFilterPress('in_progress')}
            />
            <FilterChip
              label={t('tasks.done')}
              active={quickFilter === 'done'}
              onPress={() => handleQuickFilterPress('done')}
            />
          </ScrollView>
        </View>

        {/* Tasks List or Empty State */}
        {sortedTasks.length === 0 ? (
          <EmptyState onAdd={handleAddTask} />
        ) : (
          <View style={[styles.tasksList, selectionMode && styles.tasksListWithSelection]}>
            {sortedTasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleStatus={handleToggleStatus}
                onPress={handleTaskPress}
                index={index}
                selectionMode={selectionMode}
                isSelected={selectedIds.has(task.id)}
                onSelect={handleSelectTask}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Filter Sheet */}
      <TaskFilterSheet
        visible={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        filters={filters}
        sorting={sorting}
        onFiltersChange={setFilters}
        onSortingChange={setSorting}
        onReset={handleResetFilters}
      />

      {/* Batch Actions Bar */}
      {selectionMode && selectedIds.size > 0 && (
        <BatchActionsBar
          selectedCount={selectedIds.size}
          onCancel={handleCancelSelection}
          onBatchComplete={handleBatchComplete}
          onBatchDelete={handleBatchDelete}
          onBatchSetStatus={handleBatchSetStatus}
          isProcessing={deleteManyTasks.isPending || updateManyStatus.isPending}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
  },
  subtitle: {
    fontSize: typography.size.sm,
    marginTop: spacing[1],
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPrimary: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stats
  statsRow: {
    flexDirection: 'column',
    gap: spacing[2],
    paddingHorizontal: spacing[6],
    marginBottom: spacing[6],
  },
  statMiniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3.5],
    borderRadius: radius.lg,
    gap: spacing[3],
  },
  statMiniIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statMiniValue: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    minWidth: 32,
  },
  statMiniLabel: {
    flex: 1,
    fontSize: typography.size.sm,
  },

  // Filters
  filtersContainer: {
    marginBottom: spacing[6],
  },
  filtersContent: {
    paddingHorizontal: spacing[6],
    gap: spacing[2],
  },
  filterChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
  },
  filterChipText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },

  // Tasks List
  tasksList: {
    paddingHorizontal: spacing[6],
    gap: spacing[3],
  },
  tasksListWithSelection: {
    paddingBottom: spacing[24], // Extra padding for batch action bar
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[12],
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[6],
  },
  emptyTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: typography.size.base,
    textAlign: 'center',
    marginTop: spacing[2],
    lineHeight: 22,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3.5],
    borderRadius: radius.lg,
    marginTop: spacing[6],
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
})
