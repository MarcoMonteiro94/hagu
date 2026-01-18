export {
  useTasksQuery,
  useTaskQuery,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useUpdateTaskStatus,
  useTaskStats,
  useAddSubtask,
  useToggleSubtask,
  useUpdateSubtask,
  useDeleteSubtask,
  useDeleteManyTasks,
  useUpdateManyTasksStatus,
} from './use-tasks'
export type { TaskStats } from './use-tasks'

export {
  useHabitsQuery,
  useHabitQuery,
  useCreateHabit,
  useUpdateHabit,
  useDeleteHabit,
  useArchiveHabit,
  useUnarchiveHabit,
  useToggleHabitCompletion,
  useSetCompletionValue,
  useHabitStats,
} from './use-habits'
export type { CreateHabitData, UpdateHabitData, HabitStats } from './use-habits'

export {
  useAreasQuery,
  useAreaQuery,
  useAreaBySlugQuery,
  useCreateArea,
  useUpdateArea,
  useDeleteArea,
  useReorderAreas,
} from './use-areas'

export {
  // Projects queries
  useProjectsQuery,
  useActiveProjectsQuery,
  useProjectsWithProgressQuery,
  useArchivedProjectsQuery,
  useProjectQuery,
  useProjectWithProgressQuery,
  // Projects mutations
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useArchiveProject,
  useUnarchiveProject,
  useCompleteProject,
  usePauseProject,
  useResumeProject,
  useUpdateProjectStatus,
  // Objectives
  useObjectivesQuery,
  useCreateObjective,
  useUpdateObjective,
  useDeleteObjective,
  useToggleObjectiveStatus,
  // Milestones
  useMilestonesQuery,
  useUpcomingMilestonesQuery,
  useCreateMilestone,
  useUpdateMilestone,
  useDeleteMilestone,
  useCompleteMilestone,
} from './use-projects'

export type {
  Project,
  ProjectWithProgress,
  ProjectStatus,
  Objective,
  ObjectiveStatus,
  Milestone,
  MilestoneStatus,
  CreateProjectData,
  UpdateProjectData,
  CreateObjectiveData,
  UpdateObjectiveData,
  CreateMilestoneData,
  UpdateMilestoneData,
} from './use-projects'

export type { ProjectFormData } from '@/components/projects'

export {
  // Transactions
  useTransactionsQuery,
  useTransactionsByMonthQuery,
  useTransactionQuery,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
  useDeleteManyTransactions,
  // Categories
  useCategoriesQuery,
  useCreateCategory,
  useDeleteCategory,
  // Budgets
  useBudgetsQuery,
  useBudgetsByMonthQuery,
  useUpsertBudget,
  useDeleteBudget,
  // Goals
  useGoalsQuery,
  useGoalQuery,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useAddContribution,
  // Derived hooks
  useMonthlyStats,
  useCategorySummary,
  useBudgetProgress,
  useGroupedTransactions,
} from './use-finances'

export type {
  Transaction,
  TransactionCategory,
  Budget,
  FinancialGoal,
  GoalContribution,
  TransactionType,
  RecurrenceFrequency,
  MonthlyBalance,
  CategorySummary,
  CreateTransactionData,
  CreateCategoryData,
  CreateGoalData,
  MonthlyStats,
} from './use-finances'

// Health & Gamification hooks
export {
  // Areas
  useAreasQuery as useAllAreasQuery,
  useHealthArea,
  // Metrics
  useMetricsByArea,
  useMetricsByType,
  useCreateMetric,
  useUpdateMetric,
  useDeleteMetric,
  // Gamification
  useUserStats,
  useAchievements,
  useHabitStreaks,
  useUnlockAchievement,
  useAddXp,
  // Derived
  useLevel,
  useXpProgress,
  useGlobalStreak,
  useUnlockedAchievementsCount,
  // Health-specific
  useWeightStats,
  useMetricTrend,
  useLatestMetric,
  // Constants
  METRIC_CONFIGS,
  MOOD_LABELS,
  ENERGY_LABELS,
  ACHIEVEMENT_TYPES,
  getXpForLevel,
  getXpForNextLevel,
  getXpProgress,
} from './use-health'

export type {
  MetricType,
  MetricConfig,
  CreateMetricData,
  WeightStats,
  LifeArea,
  MetricEntry,
  UserStats,
  Achievement,
  StreakData,
  WeightGoal,
  HealthGoals,
} from './use-health'

// Pomodoro hooks
export {
  usePomodoroTimer,
  usePomodoroSettings,
  usePomodoroSessions,
  usePomodoroStats,
} from './use-pomodoro'

export type {
  TimerMode,
  TimerState,
  PomodoroSettings,
  PomodoroSession,
  PomodoroStats,
} from './use-pomodoro'

// Notes hooks
export {
  useNotebooksQuery,
  useNotebookQuery,
  useCreateNotebook,
  useUpdateNotebook,
  useDeleteNotebook,
  useNotesQuery,
  useNoteQuery,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
  useToggleNotePin,
  useSearchNotes,
  useAutoSaveNote,
  NOTEBOOK_COLORS,
} from './use-notes'

export type {
  Notebook,
  Note,
  CreateNotebookData,
  UpdateNotebookData,
  CreateNoteData,
  UpdateNoteData,
} from './use-notes'
