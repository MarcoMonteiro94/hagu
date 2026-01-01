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
  areaId?: string
  dueDate?: string
  priority?: TaskPriority
  status: TaskStatus
  tags: string[]
  estimatedMinutes?: number
  recurrence?: RecurrencePattern
  subtasks: Subtask[]
  linkedTransactionId?: string // Links task to a recurring expense for payment reminders
  createdAt: string
  completedAt?: string
}

// Project Types
export interface Project {
  id: string
  title: string
  description?: string
  areaId?: string
  color?: string
  createdAt: string
  archivedAt?: string
}

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

export interface UserSettings {
  theme: Theme
  locale: Locale
  weekStartsOn: 0 | 1 // 0 = Sunday, 1 = Monday
  notificationsEnabled: boolean
  onboardingCompleted: boolean
  userName?: string
  currency?: import('./finances').CurrencyCode
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

// App Data for Export/Import
export interface AppData {
  version: string
  exportedAt: string
  habits: Habit[]
  tasks: Task[]
  projects: Project[]
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
