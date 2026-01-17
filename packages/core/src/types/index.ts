// Habit Types
export type HabitFrequency =
  | { type: 'daily' }
  | { type: 'weekly'; daysPerWeek: number }
  | { type: 'specificDays'; days: number[] } // 0-6 (Sun-Sat)
  | { type: 'monthly'; timesPerMonth: number }

export type HabitTracking =
  | { type: 'boolean' }
  | { type: 'quantitative'; target: number; unit: string }

export interface HabitCompletion {
  date: string // ISO date string (YYYY-MM-DD)
  value: number // 1 for boolean, actual value for quantitative
  completedAt: string // ISO datetime
}

export interface Habit {
  id: string
  title: string
  description?: string
  areaId: string
  projectId?: string // Link habit to a specific project
  frequency: HabitFrequency
  tracking: HabitTracking
  color: string
  icon?: string
  completions: HabitCompletion[]
  createdAt: string
  archivedAt?: string
  reminderTime?: string // HH:mm format
  reminderEnabled?: boolean
  notebookId?: string // Link to a study notebook
}

// Task Types
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'pending' | 'in_progress' | 'done'

export interface Subtask {
  id: string
  title: string
  done: boolean
}

export interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number // every X days/weeks/months
  endDate?: string
}

export interface Task {
  id: string
  title: string
  description?: string
  projectId?: string
  objectiveId?: string // Link task to a specific objective within a project
  areaId?: string
  notebookId?: string
  pageId?: string
  dueDate?: string
  priority?: TaskPriority
  status: TaskStatus
  tags: string[]
  estimatedMinutes?: number
  recurrence?: RecurrencePattern
  subtasks: Subtask[]
  linkedTransactionId?: string
  createdAt: string
  completedAt?: string
}

// Project Types - re-exported from projects.ts
// See src/types/projects.ts for full type definitions

// Life Area Types
export interface LifeArea {
  id: string
  name: string
  slug: string
  color: string
  icon: string
  isDefault: boolean
  order: number
  createdAt: string
}

// Metrics Types
export interface MetricEntry {
  id: string
  areaId: string
  type: string // 'weight', 'mood', 'energy', etc.
  value: number
  unit?: string
  date: string
  createdAt: string
}

// Gamification Types
export interface Achievement {
  id: string
  type: string
  unlockedAt: string
  data?: Record<string, unknown>
}

export interface StreakData {
  habitId: string
  currentStreak: number
  longestStreak: number
  lastCompletedDate?: string
}

export interface UserStats {
  totalXp: number
  level: number
  habitsCompleted: number
  tasksCompleted: number
  currentStreak: number
  longestStreak: number
}

// Settings Types
export type Theme = 'dark' | 'light' | 'system'
export type Locale = 'pt-BR' | 'en-US'

// Home Widget Types
export type HomeWidgetType = 'habits' | 'tasks' | 'notebooks' | 'finances' | 'health'

export interface HomeWidget {
  id: HomeWidgetType
  visible: boolean
  order: number
}

export const DEFAULT_HOME_WIDGETS: HomeWidget[] = [
  { id: 'habits', visible: true, order: 0 },
  { id: 'tasks', visible: true, order: 1 },
  { id: 'notebooks', visible: true, order: 2 },
  { id: 'finances', visible: false, order: 3 },
  { id: 'health', visible: false, order: 4 },
]

// Health Goals Types
export interface WeightGoal {
  target: number
  unit: string
  startWeight?: number
  startDate?: string
}

export interface HealthGoals {
  weight?: WeightGoal
}

export interface UserSettings {
  theme: Theme
  locale: Locale
  weekStartsOn: 0 | 1 // 0 = Sunday, 1 = Monday
  notificationsEnabled: boolean
  onboardingCompleted: boolean
  userName?: string
  currency?: import('./finances').CurrencyCode
  homeWidgets?: HomeWidget[]
  hideBalances?: boolean
  healthGoals?: HealthGoals
}

// Re-export finance types
export type {
  Transaction,
  TransactionType,
  TransactionCategory,
  Budget,
  FinancialGoal,
  GoalContribution,
  InvestmentSimulation,
  MonthlyBalance,
  CategorySummary,
  CurrencyCode,
  CurrencyConfig,
  CompoundingFrequency,
  RecurrenceFrequency,
} from './finances'

export { CURRENCIES } from './finances'

// Re-export studies types
export type {
  NotebookContent,
  Notebook,
  NotebookWithPageCount,
  NotebookPage,
  NotebookPageSummary,
  CreateNotebookData,
  UpdateNotebookData,
  CreatePageData,
  UpdatePageData,
  NotebookColor,
  NotebookIcon,
} from './studies'

export { NOTEBOOK_COLORS, NOTEBOOK_ICONS } from './studies'

// Re-export project types
export type {
  Project,
  ProjectStatus,
  ProjectWithProgress,
  ProjectSummary,
  Objective,
  ObjectiveStatus,
  Milestone,
  MilestoneStatus,
  ProjectMetric,
  ProjectMetricEntry,
  CreateProjectData,
  UpdateProjectData,
  CreateObjectiveData,
  UpdateObjectiveData,
  CreateMilestoneData,
  UpdateMilestoneData,
  CreateProjectMetricData,
  UpdateProjectMetricData,
  ProjectIcon,
  ProjectColor,
} from './projects'

export {
  PROJECT_STATUS_OPTIONS,
  PROJECT_ICONS,
  PROJECT_COLORS,
} from './projects'

// App Data for Export/Import
export interface AppData {
  version: string
  exportedAt: string
  habits: Habit[]
  tasks: Task[]
  projects: import('./projects').Project[]
  areas: LifeArea[]
  metrics: MetricEntry[]
  achievements: Achievement[]
  streaks: StreakData[]
  stats: UserStats
  settings: UserSettings
  transactions?: import('./finances').Transaction[]
  financialGoals?: import('./finances').FinancialGoal[]
  budgets?: import('./finances').Budget[]
}
