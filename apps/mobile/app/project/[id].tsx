import { useState, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  ArrowLeft,
  Edit2,
  MoreVertical,
  Target,
  Flag,
  ListTodo,
  Calendar,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Archive,
  Play,
  Pause,
} from 'lucide-react-native'
import { useTheme, cardShadow, spacing, radius, typography } from '@/theme'
import {
  useProjectWithProgressQuery,
  useUpdateProject,
  useDeleteProject,
  useArchiveProject,
  useCompleteProject,
  usePauseProject,
  useResumeProject,
  useObjectivesQuery,
  useCreateObjective,
  useToggleObjectiveStatus,
  useDeleteObjective,
  useMilestonesQuery,
  useCreateMilestone,
  useCompleteMilestone,
  useDeleteMilestone,
  useTasksQuery,
  useCreateTask,
  useUpdateTaskStatus,
} from '@/hooks'
import { ProjectForm } from '@/components/projects'
import { ObjectivesList } from '@/components/projects/ObjectivesList'
import { MilestoneTimeline } from '@/components/projects/MilestoneTimeline'
import type { ProjectFormData, Objective, Milestone, ObjectiveStatus } from '@/hooks'

type TabType = 'overview' | 'objectives' | 'milestones' | 'tasks'

function calculateDaysRemaining(dueDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const diff = due.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function ProjectDetailScreen() {
  const { t, i18n } = useTranslation()
  const { colors } = useTheme()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()

  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [showEditForm, setShowEditForm] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const { data: project, isLoading, refetch } = useProjectWithProgressQuery(id)
  const { data: objectives = [] } = useObjectivesQuery(id)
  const { data: milestones = [] } = useMilestonesQuery(id)
  const { data: allTasks = [] } = useTasksQuery()

  // Filter tasks by project
  const projectTasks = useMemo(() => {
    return allTasks.filter((task) => task.projectId === id)
  }, [allTasks, id])

  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()
  const archiveProject = useArchiveProject()
  const completeProject = useCompleteProject()
  const pauseProject = usePauseProject()
  const resumeProject = useResumeProject()
  const createObjective = useCreateObjective()
  const toggleObjectiveStatus = useToggleObjectiveStatus()
  const deleteObjective = useDeleteObjective()
  const createMilestone = useCreateMilestone()
  const completeMilestone = useCompleteMilestone()
  const deleteMilestone = useDeleteMilestone()
  const createTask = useCreateTask()
  const updateTaskStatus = useUpdateTaskStatus()

  const projectColor = project?.color || colors.primary

  const daysRemaining = useMemo(() => {
    if (!project?.dueDate) return null
    return calculateDaysRemaining(project.dueDate)
  }, [project?.dueDate])

  const handleBack = useCallback(() => {
    router.back()
  }, [router])

  const handleEdit = useCallback(() => {
    setShowEditForm(true)
    setShowMenu(false)
  }, [])

  const handleEditSubmit = useCallback(
    async (data: ProjectFormData) => {
      if (!id) return
      try {
        await updateProject.mutateAsync({
          id,
          updates: {
            title: data.title,
            description: data.description,
            color: data.color,
            dueDate: data.dueDate,
          },
        })
        setShowEditForm(false)
      } catch (error) {
        Alert.alert(t('common.error'), t('projects.deleteError'))
      }
    },
    [id, updateProject, t]
  )

  const handleDelete = useCallback(() => {
    setShowMenu(false)
    Alert.alert(t('projects.deleteProject'), t('projects.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProject.mutateAsync(id!)
            router.back()
          } catch (error) {
            Alert.alert(t('common.error'), t('projects.deleteError'))
          }
        },
      },
    ])
  }, [id, deleteProject, router, t])

  const handleArchive = useCallback(async () => {
    setShowMenu(false)
    try {
      await archiveProject.mutateAsync(id!)
      router.back()
    } catch (error) {
      Alert.alert(t('common.error'), t('projects.deleteError'))
    }
  }, [id, archiveProject, router, t])

  const handleComplete = useCallback(async () => {
    setShowMenu(false)
    try {
      await completeProject.mutateAsync(id!)
    } catch (error) {
      Alert.alert(t('common.error'), t('projects.deleteError'))
    }
  }, [id, completeProject, t])

  const handlePause = useCallback(async () => {
    setShowMenu(false)
    try {
      await pauseProject.mutateAsync(id!)
    } catch (error) {
      Alert.alert(t('common.error'), t('projects.deleteError'))
    }
  }, [id, pauseProject, t])

  const handleResume = useCallback(async () => {
    setShowMenu(false)
    try {
      await resumeProject.mutateAsync(id!)
    } catch (error) {
      Alert.alert(t('common.error'), t('projects.deleteError'))
    }
  }, [id, resumeProject, t])

  // Objective handlers
  const handleAddObjective = useCallback(
    async (title: string) => {
      if (!id) return
      try {
        await createObjective.mutateAsync({ projectId: id, title })
      } catch (error) {
        Alert.alert(t('common.error'), t('projects.deleteError'))
      }
    },
    [id, createObjective, t]
  )

  const handleToggleObjective = useCallback(
    async (objectiveId: string, currentStatus: ObjectiveStatus) => {
      if (!id) return
      try {
        await toggleObjectiveStatus.mutateAsync({
          id: objectiveId,
          projectId: id,
          currentStatus,
        })
      } catch (error) {
        Alert.alert(t('common.error'), t('projects.deleteError'))
      }
    },
    [id, toggleObjectiveStatus, t]
  )

  const handleDeleteObjective = useCallback(
    async (objectiveId: string) => {
      if (!id) return
      Alert.alert(t('projects.objective.deleteTitle'), t('projects.objective.deleteConfirm'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteObjective.mutateAsync({ id: objectiveId, projectId: id })
            } catch (error) {
              Alert.alert(t('common.error'), t('projects.deleteError'))
            }
          },
        },
      ])
    },
    [id, deleteObjective, t]
  )

  // Milestone handlers
  const handleAddMilestone = useCallback(
    async (title: string, targetDate: string) => {
      if (!id) return
      try {
        await createMilestone.mutateAsync({ projectId: id, title, targetDate })
      } catch (error) {
        Alert.alert(t('common.error'), t('projects.deleteError'))
      }
    },
    [id, createMilestone, t]
  )

  const handleCompleteMilestone = useCallback(
    async (milestoneId: string) => {
      if (!id) return
      try {
        await completeMilestone.mutateAsync({ id: milestoneId, projectId: id })
      } catch (error) {
        Alert.alert(t('common.error'), t('projects.deleteError'))
      }
    },
    [id, completeMilestone, t]
  )

  const handleDeleteMilestone = useCallback(
    async (milestoneId: string) => {
      if (!id) return
      Alert.alert(t('projects.milestone.deleteTitle'), t('projects.milestone.deleteConfirm'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMilestone.mutateAsync({ id: milestoneId, projectId: id })
            } catch (error) {
              Alert.alert(t('common.error'), t('projects.deleteError'))
            }
          },
        },
      ])
    },
    [id, deleteMilestone, t]
  )

  // Task handlers
  const handleQuickAddTask = useCallback(async () => {
    if (!id || !newTaskTitle.trim()) return
    try {
      await createTask.mutateAsync({
        title: newTaskTitle.trim(),
        status: 'pending',
        tags: [],
        projectId: id,
      })
      setNewTaskTitle('')
    } catch (error) {
      Alert.alert(t('common.error'), t('tasks.saveError'))
    }
  }, [id, newTaskTitle, createTask, t])

  const handleToggleTask = useCallback(
    async (taskId: string, currentStatus: string) => {
      try {
        const newStatus = currentStatus === 'done' ? 'pending' : 'done'
        await updateTaskStatus.mutateAsync({ id: taskId, status: newStatus as 'pending' | 'in_progress' | 'done' })
      } catch (error) {
        Alert.alert(t('common.error'), t('tasks.saveError'))
      }
    },
    [updateTaskStatus, t]
  )

  const handleTaskPress = useCallback(
    (taskId: string) => {
      router.push(`/task/${taskId}`)
    },
    [router]
  )

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    )
  }

  if (!project) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.foreground }}>{t('projects.noProjects')}</Text>
        </View>
      </SafeAreaView>
    )
  }

  const tabs: { key: TabType; label: string; icon: typeof Target }[] = [
    { key: 'overview', label: t('projects.overview'), icon: Target },
    { key: 'objectives', label: t('projects.objectives'), icon: CheckCircle2 },
    { key: 'milestones', label: t('projects.milestones'), icon: Flag },
    { key: 'tasks', label: t('projects.tasks'), icon: ListTodo },
  ]

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View
       
        style={[styles.header, { borderBottomColor: colors.border }]}
      >
        <Pressable onPress={handleBack} hitSlop={8}>
          <ArrowLeft size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
          {project.title}
        </Text>
        <View style={styles.headerActions}>
          <Pressable onPress={handleEdit} hitSlop={8} style={styles.headerButton}>
            <Edit2 size={20} color={colors.foreground} />
          </Pressable>
          <Pressable onPress={() => setShowMenu(!showMenu)} hitSlop={8}>
            <MoreVertical size={20} color={colors.foreground} />
          </Pressable>
        </View>
      </View>

      {/* Menu Dropdown */}
      {showMenu && (
        <View
         
          style={[styles.menu, { backgroundColor: colors.card }, cardShadow]}
        >
          {project.status === 'active' && (
            <>
              <Pressable onPress={handleComplete} style={styles.menuItem}>
                <CheckCircle2 size={18} color={colors.success} />
                <Text style={[styles.menuItemText, { color: colors.foreground }]}>
                  {t('projects.actions.complete')}
                </Text>
              </Pressable>
              <Pressable onPress={handlePause} style={styles.menuItem}>
                <Pause size={18} color={colors.warning} />
                <Text style={[styles.menuItemText, { color: colors.foreground }]}>
                  {t('projects.actions.pause')}
                </Text>
              </Pressable>
            </>
          )}
          {project.status === 'paused' && (
            <Pressable onPress={handleResume} style={styles.menuItem}>
              <Play size={18} color={colors.success} />
              <Text style={[styles.menuItemText, { color: colors.foreground }]}>
                {t('projects.actions.resume')}
              </Text>
            </Pressable>
          )}
          <Pressable onPress={handleArchive} style={styles.menuItem}>
            <Archive size={18} color={colors.mutedForeground} />
            <Text style={[styles.menuItemText, { color: colors.foreground }]}>
              {t('projects.actions.archive')}
            </Text>
          </Pressable>
          <Pressable onPress={handleDelete} style={styles.menuItem}>
            <Trash2 size={18} color={colors.error} />
            <Text style={[styles.menuItemText, { color: colors.error }]}>
              {t('common.delete')}
            </Text>
          </Pressable>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {/* Project Info Card */}
        <View
         
          style={[styles.infoCard, { backgroundColor: colors.card }, cardShadow]}
        >
          <View style={[styles.colorBar, { backgroundColor: projectColor }]} />
          <View style={styles.infoContent}>
            {project.description && (
              <Text style={[styles.description, { color: colors.mutedForeground }]}>
                {project.description}
              </Text>
            )}

            {/* Progress */}
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressLabel, { color: colors.foreground }]}>
                  {t('projects.progress')}
                </Text>
                <Text style={[styles.progressValue, { color: projectColor }]}>
                  {project.progress}%
                </Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    { backgroundColor: projectColor, width: `${project.progress}%` },
                  ]}
                />
              </View>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Target size={16} color={colors.mutedForeground} />
                <Text style={[styles.statText, { color: colors.mutedForeground }]}>
                  {project.completedObjectivesCount}/{project.objectivesCount}{' '}
                  {t('projects.stats.objectivesCompleted')}
                </Text>
              </View>
              <View style={styles.statItem}>
                <ListTodo size={16} color={colors.mutedForeground} />
                <Text style={[styles.statText, { color: colors.mutedForeground }]}>
                  {project.completedTasksCount}/{project.tasksCount}{' '}
                  {t('projects.stats.tasksCompleted')}
                </Text>
              </View>
              {daysRemaining !== null && (
                <View style={styles.statItem}>
                  <Calendar
                    size={16}
                    color={daysRemaining < 0 ? colors.error : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.statText,
                      { color: daysRemaining < 0 ? colors.error : colors.mutedForeground },
                    ]}
                  >
                    {daysRemaining < 0
                      ? t('projects.stats.overdue')
                      : `${daysRemaining} ${t('projects.stats.daysRemaining')}`}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tabs}>
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key
                const Icon = tab.icon
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key)}
                    style={[
                      styles.tab,
                      { backgroundColor: isActive ? projectColor + '20' : 'transparent' },
                    ]}
                  >
                    <Icon size={16} color={isActive ? projectColor : colors.mutedForeground} />
                    <Text
                      style={[
                        styles.tabText,
                        { color: isActive ? projectColor : colors.mutedForeground },
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </ScrollView>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'overview' && (
            <View>
              {/* Overview shows summary of objectives and milestones */}
              <View style={styles.overviewSection}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    {t('projects.objectives')}
                  </Text>
                  <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>
                    {project.completedObjectivesCount}/{project.objectivesCount}
                  </Text>
                </View>
                {objectives.slice(0, 3).map((objective) => (
                  <View key={objective.id} style={styles.previewItem}>
                    {objective.status === 'completed' ? (
                      <CheckCircle2 size={18} color={colors.success} />
                    ) : (
                      <Circle size={18} color={colors.mutedForeground} />
                    )}
                    <Text
                      style={[
                        styles.previewText,
                        { color: colors.foreground },
                        objective.status === 'completed' && {
                          textDecorationLine: 'line-through',
                          color: colors.mutedForeground,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {objective.title}
                    </Text>
                  </View>
                ))}
                {objectives.length > 3 && (
                  <Pressable onPress={() => setActiveTab('objectives')}>
                    <Text style={[styles.viewMore, { color: projectColor }]}>
                      +{objectives.length - 3} more
                    </Text>
                  </Pressable>
                )}
              </View>

              <View style={[styles.overviewSection, { marginTop: spacing[4] }]}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    {t('projects.milestones')}
                  </Text>
                  <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>
                    {milestones.filter((m) => m.status === 'completed').length}/{milestones.length}
                  </Text>
                </View>
                {milestones.slice(0, 3).map((milestone) => (
                  <View key={milestone.id} style={styles.previewItem}>
                    <Flag
                      size={18}
                      color={milestone.status === 'completed' ? colors.success : colors.warning}
                    />
                    <Text
                      style={[
                        styles.previewText,
                        { color: colors.foreground },
                        milestone.status === 'completed' && {
                          textDecorationLine: 'line-through',
                          color: colors.mutedForeground,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {milestone.title}
                    </Text>
                  </View>
                ))}
                {milestones.length > 3 && (
                  <Pressable onPress={() => setActiveTab('milestones')}>
                    <Text style={[styles.viewMore, { color: projectColor }]}>
                      +{milestones.length - 3} more
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {activeTab === 'objectives' && (
            <ObjectivesList
              objectives={objectives}
              projectColor={projectColor}
              onAdd={handleAddObjective}
              onToggle={handleToggleObjective}
              onDelete={handleDeleteObjective}
              isAdding={createObjective.isPending}
            />
          )}

          {activeTab === 'milestones' && (
            <MilestoneTimeline
              milestones={milestones}
              projectColor={projectColor}
              onAdd={handleAddMilestone}
              onComplete={handleCompleteMilestone}
              onDelete={handleDeleteMilestone}
              isAdding={createMilestone.isPending}
            />
          )}

          {activeTab === 'tasks' && (
            <View style={styles.tasksSection}>
              {/* Quick Add Task */}
              <View
                style={[
                  styles.quickAddContainer,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  cardShadow,
                ]}
              >
                <TextInput
                  style={[styles.quickAddInput, { color: colors.foreground }]}
                  value={newTaskTitle}
                  onChangeText={setNewTaskTitle}
                  placeholder={t('tasks.titlePlaceholder')}
                  placeholderTextColor={colors.mutedForeground}
                  onSubmitEditing={handleQuickAddTask}
                  returnKeyType="done"
                />
                <Pressable
                  onPress={handleQuickAddTask}
                  disabled={!newTaskTitle.trim() || createTask.isPending}
                  style={[
                    styles.quickAddButton,
                    { backgroundColor: projectColor },
                    (!newTaskTitle.trim() || createTask.isPending) && { opacity: 0.5 },
                  ]}
                >
                  <Plus size={20} color="#fff" />
                </Pressable>
              </View>

              {/* Task List */}
              {projectTasks.length === 0 ? (
                <View style={styles.emptyTasks}>
                  <ListTodo size={48} color={colors.mutedForeground} />
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                    {t('tasks.noTasks')}
                  </Text>
                  <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
                    {t('tasks.emptyDescription')}
                  </Text>
                </View>
              ) : (
                <View style={styles.taskList}>
                  {projectTasks.map((task, index) => (
                    <View
                      key={task.id}
                     
                      style={[styles.taskItem, { backgroundColor: colors.card }, cardShadow]}
                    >
                      <Pressable
                        onPress={() => handleToggleTask(task.id, task.status)}
                        style={styles.taskCheckbox}
                        hitSlop={8}
                      >
                        {task.status === 'done' ? (
                          <CheckCircle2 size={22} color={colors.success} strokeWidth={2.5} />
                        ) : (
                          <Circle size={22} color={colors.mutedForeground} strokeWidth={1.5} />
                        )}
                      </Pressable>

                      <Pressable
                        onPress={() => handleTaskPress(task.id)}
                        style={styles.taskContent}
                      >
                        <Text
                          style={[
                            styles.taskTitle,
                            { color: colors.foreground },
                            task.status === 'done' && styles.taskTitleDone,
                            task.status === 'done' && { color: colors.mutedForeground },
                          ]}
                          numberOfLines={2}
                        >
                          {task.title}
                        </Text>
                        {task.dueDate && (
                          <View style={styles.taskMeta}>
                            <Calendar size={12} color={colors.mutedForeground} />
                            <Text style={[styles.taskDueDate, { color: colors.mutedForeground }]}>
                              {new Date(task.dueDate).toLocaleDateString(i18n.language)}
                            </Text>
                          </View>
                        )}
                      </Pressable>

                      {task.priority && (
                        <View
                          style={[
                            styles.priorityBadge,
                            {
                              backgroundColor:
                                task.priority === 'urgent'
                                  ? colors.error + '20'
                                  : task.priority === 'high'
                                  ? '#f97316' + '20'
                                  : task.priority === 'medium'
                                  ? '#f59e0b' + '20'
                                  : colors.success + '20',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.priorityText,
                              {
                                color:
                                  task.priority === 'urgent'
                                    ? colors.error
                                    : task.priority === 'high'
                                    ? '#f97316'
                                    : task.priority === 'medium'
                                    ? '#f59e0b'
                                    : colors.success,
                              },
                            ]}
                          >
                            {t(`tasks.${task.priority}`)}
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Edit Form Modal */}
      <ProjectForm
        visible={showEditForm}
        onClose={() => setShowEditForm(false)}
        onSubmit={handleEditSubmit}
        project={project}
        isLoading={updateProject.isPending}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginHorizontal: spacing[3],
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  headerButton: {
    padding: spacing[1],
  },
  menu: {
    position: 'absolute',
    top: 100,
    right: spacing[4],
    borderRadius: radius.lg,
    padding: spacing[2],
    zIndex: 100,
    minWidth: 180,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: radius.md,
  },
  menuItemText: {
    fontSize: typography.size.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[8],
  },
  infoCard: {
    margin: spacing[4],
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  colorBar: {
    height: 4,
  },
  infoContent: {
    padding: spacing[4],
  },
  description: {
    fontSize: typography.size.sm,
    lineHeight: 20,
    marginBottom: spacing[4],
  },
  progressSection: {
    marginBottom: spacing[4],
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  progressLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  progressValue: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsRow: {
    gap: spacing[2],
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  statText: {
    fontSize: typography.size.xs,
  },
  tabsContainer: {
    paddingHorizontal: spacing[4],
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
  },
  tabText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  tabContent: {
    padding: spacing[4],
    minHeight: 200,
  },
  overviewSection: {
    gap: spacing[2],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  sectionTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  sectionCount: {
    fontSize: typography.size.sm,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[1],
  },
  previewText: {
    flex: 1,
    fontSize: typography.size.sm,
  },
  viewMore: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    marginTop: spacing[1],
  },
  tasksSection: {
    flex: 1,
    gap: spacing[4],
  },
  quickAddContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingLeft: spacing[3],
    gap: spacing[2],
  },
  quickAddInput: {
    flex: 1,
    fontSize: typography.size.sm,
    paddingVertical: spacing[3],
  },
  quickAddButton: {
    padding: spacing[3],
    borderTopRightRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  emptyTasks: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[8],
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
  taskList: {
    gap: spacing[2],
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: radius.lg,
    gap: spacing[3],
  },
  taskCheckbox: {
    padding: spacing[0.5],
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    lineHeight: 20,
  },
  taskTitleDone: {
    textDecorationLine: 'line-through',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[1],
  },
  taskDueDate: {
    fontSize: typography.size.xs,
  },
  priorityBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
    borderRadius: radius.sm,
  },
  priorityText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
})
