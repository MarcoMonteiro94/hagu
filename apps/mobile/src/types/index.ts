// Widget Types for Bento Grid
export type WidgetSize = 'small' | 'medium' | 'large' | 'wide'

export type HomeWidgetType = 'habits' | 'tasks' | 'notebooks' | 'finances' | 'health' | 'stats'

export interface HomeWidget {
  id: HomeWidgetType
  visible: boolean
  order: number
  size?: WidgetSize
}

export const DEFAULT_HOME_WIDGETS: HomeWidget[] = [
  { id: 'habits', visible: true, order: 0, size: 'large' },
  { id: 'tasks', visible: true, order: 1, size: 'large' },
  { id: 'health', visible: false, order: 2, size: 'large' },
  { id: 'finances', visible: false, order: 3, size: 'wide' },
  { id: 'notebooks', visible: true, order: 4, size: 'wide' },
]

// Gamification Types
export interface UserStats {
  totalXp: number
  level: number
  habitsCompleted: number
  tasksCompleted: number
  currentStreak: number
  longestStreak: number
}

// Task Types
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'pending' | 'in_progress' | 'done'

export interface Subtask {
  id: string
  title: string
  done: boolean
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
  subtasks: Subtask[]
  createdAt: string
  completedAt?: string
}

// Habit Types
export type HabitFrequency =
  | { type: 'daily' }
  | { type: 'weekly'; daysPerWeek: number }
  | { type: 'specificDays'; days: number[] }
  | { type: 'monthly'; timesPerMonth: number }

export type HabitTracking =
  | { type: 'boolean' }
  | { type: 'quantitative'; target: number; unit: string }

export interface HabitCompletion {
  date: string
  value: number
  completedAt: string
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
}
