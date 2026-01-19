import { useState, useCallback, useMemo } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useRouter } from 'expo-router'
import {
  Plus,
  FolderKanban,
  Target,
  TrendingUp,
  Briefcase,
  Archive,
} from 'lucide-react-native'
import { useTheme, cardShadow, spacing, radius, typography } from '@/theme'
import {
  useProjectsWithProgressQuery,
  useArchivedProjectsQuery,
  useCreateProject,
  useUnarchiveProject,
} from '@/hooks'
import { ProjectCard, ProjectForm } from '@/components/projects'
import type { ProjectWithProgress, ProjectFormData } from '@/hooks'

interface StatMiniCardProps {
  value: string | number
  label: string
  icon: React.ReactNode
  iconBgColor: string
  delay: number
}

function StatMiniCard({ value, label, icon, iconBgColor, delay }: StatMiniCardProps) {
  const { colors } = useTheme()

  return (
    <View
     
      style={[styles.statMiniCard, { backgroundColor: colors.card }, cardShadow]}
    >
      <View style={[styles.statMiniIcon, { backgroundColor: iconBgColor }]}>
        {icon}
      </View>
      <View style={styles.statMiniTextContainer}>
        <Text style={[styles.statMiniValue, { color: colors.foreground }]}>{value}</Text>
        <Text style={[styles.statMiniLabel, { color: colors.mutedForeground }]}>{label}</Text>
      </View>
    </View>
  )
}

interface EmptyStateProps {
  onCreatePress: () => void
}

function EmptyState({ onCreatePress }: EmptyStateProps) {
  const { t } = useTranslation()
  const { colors } = useTheme()

  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconContainer, { backgroundColor: colors.primary + '15' }]}>
        <FolderKanban size={48} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        {t('projects.noProjects')}
      </Text>
      <Text style={[styles.emptyDescription, { color: colors.mutedForeground }]}>
        {t('projects.emptyDescription')}
      </Text>
      <Pressable
        onPress={onCreatePress}
        style={[styles.emptyButton, { backgroundColor: colors.primary }]}
      >
        <Plus size={20} color={colors.white} />
        <Text style={styles.emptyButtonText}>{t('projects.createFirst')}</Text>
      </Pressable>
    </View>
  )
}

export default function ProjectsScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const router = useRouter()

  const [showForm, setShowForm] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  const { data: projects = [], isLoading, refetch } = useProjectsWithProgressQuery()
  const { data: archivedProjects = [] } = useArchivedProjectsQuery()

  const createProject = useCreateProject()
  const unarchiveProject = useUnarchiveProject()

  const activeCount = useMemo(
    () => projects.filter((p) => p.status === 'active').length,
    [projects]
  )

  const totalObjectives = useMemo(
    () => projects.reduce((sum, p) => sum + p.objectivesCount, 0),
    [projects]
  )

  const averageProgress = useMemo(() => {
    if (projects.length === 0) return 0
    const totalProgress = projects.reduce((sum, p) => sum + p.progress, 0)
    return Math.round(totalProgress / projects.length)
  }, [projects])

  const handleCreatePress = useCallback(() => {
    setShowForm(true)
  }, [])

  const handleFormClose = useCallback(() => {
    setShowForm(false)
  }, [])

  const handleFormSubmit = useCallback(
    async (data: ProjectFormData) => {
      try {
        await createProject.mutateAsync({
          title: data.title,
          description: data.description,
          color: data.color,
          dueDate: data.dueDate,
        })
        setShowForm(false)
      } catch (error) {
        Alert.alert(t('common.error'), t('projects.form.titleRequired'))
      }
    },
    [createProject, t]
  )

  const handleProjectPress = useCallback(
    (project: ProjectWithProgress) => {
      router.push(`/project/${project.id}`)
    },
    [router]
  )

  const handleUnarchive = useCallback(
    async (projectId: string) => {
      try {
        await unarchiveProject.mutateAsync(projectId)
      } catch (error) {
        Alert.alert(t('common.error'), t('projects.deleteError'))
      }
    },
    [unarchiveProject, t]
  )

  const toggleArchived = useCallback(() => {
    setShowArchived((prev) => !prev)
  }, [])

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {t('projects.title')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {projects.length}{' '}
              {projects.length === 1 ? t('projects.active') : t('projects.actives')}
            </Text>
          </View>
          <Pressable
            onPress={handleCreatePress}
            style={[styles.iconButtonPrimary, { backgroundColor: colors.primary }]}
          >
            <Plus size={22} color={colors.white} />
          </Pressable>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatMiniCard
            value={activeCount}
            label={t('projects.status.active')}
            icon={<Briefcase size={16} color={colors.primary} />}
            iconBgColor={colors.primary + '20'}
            delay={100}
          />
          <StatMiniCard
            value={totalObjectives}
            label={t('projects.objectives')}
            icon={<Target size={16} color={colors.success} />}
            iconBgColor={colors.success + '20'}
            delay={150}
          />
          <StatMiniCard
            value={`${averageProgress}%`}
            label={t('projects.progress')}
            icon={<TrendingUp size={16} color={colors.info} />}
            iconBgColor={colors.info + '20'}
            delay={200}
          />
        </View>

        {/* Projects List or Empty State */}
        {projects.length === 0 && !isLoading ? (
          <EmptyState onCreatePress={handleCreatePress} />
        ) : (
          <View style={styles.projectsList}>
            {projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                onPress={handleProjectPress}
                index={index}
              />
            ))}
          </View>
        )}

        {/* Archived Section */}
        {archivedProjects.length > 0 && (
          <View
           
            style={styles.archivedSection}
          >
            <Pressable onPress={toggleArchived} style={styles.archivedHeader}>
              <View style={styles.archivedHeaderLeft}>
                <Archive size={18} color={colors.mutedForeground} />
                <Text style={[styles.archivedTitle, { color: colors.mutedForeground }]}>
                  {showArchived ? t('projects.hideArchived') : t('projects.showArchived')}
                </Text>
              </View>
              <Text style={[styles.archivedCount, { color: colors.mutedForeground }]}>
                {archivedProjects.length}
              </Text>
            </Pressable>

            {showArchived && (
              <View style={styles.archivedList}>
                {archivedProjects.map((project) => (
                  <Pressable
                    key={project.id}
                    onPress={() => handleUnarchive(project.id)}
                    style={[styles.archivedItem, { backgroundColor: colors.card }, cardShadow]}
                  >
                    <View
                      style={[
                        styles.archivedItemColor,
                        { backgroundColor: project.color || colors.primary },
                      ]}
                    />
                    <View style={styles.archivedItemContent}>
                      <Text
                        style={[styles.archivedItemTitle, { color: colors.foreground }]}
                        numberOfLines={1}
                      >
                        {project.title}
                      </Text>
                      <Text style={[styles.archivedItemAction, { color: colors.accent }]}>
                        {t('projects.actions.unarchive')}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Project Form Modal */}
      <ProjectForm
        visible={showForm}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        isLoading={createProject.isPending}
      />
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
    paddingBottom: 32,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  iconButtonPrimary: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  statMiniCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  statMiniIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statMiniTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  statMiniValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statMiniLabel: {
    fontSize: 12,
  },

  // Projects List
  projectsList: {
    paddingHorizontal: 24,
    gap: 16,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Archived Section
  archivedSection: {
    marginTop: spacing[6],
    paddingHorizontal: 24,
  },
  archivedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
  },
  archivedHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  archivedTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  archivedCount: {
    fontSize: typography.size.sm,
  },
  archivedList: {
    gap: spacing[2],
    marginTop: spacing[2],
  },
  archivedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  archivedItemColor: {
    width: 4,
    alignSelf: 'stretch',
  },
  archivedItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[3],
  },
  archivedItemTitle: {
    fontSize: typography.size.sm,
    flex: 1,
    marginRight: spacing[2],
  },
  archivedItemAction: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
})
