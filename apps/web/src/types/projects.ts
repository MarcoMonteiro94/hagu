// Project Types for the Projects Area
// Replaces the basic Project type with a full-featured project management system

export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived'

export type ObjectiveStatus = 'pending' | 'in_progress' | 'completed'

export type MilestoneStatus = 'upcoming' | 'in_progress' | 'completed' | 'missed'

// Core Project type with all features
export interface Project {
  id: string
  title: string
  description?: string
  areaId?: string // Optional link to an area (defaults to Projects area)
  color?: string // Project color (defaults to area color or theme default)
  icon?: string
  status: ProjectStatus
  dueDate?: string // Optional deadline (YYYY-MM-DD)
  startDate?: string // When the project started
  completedAt?: string // When the project was completed
  archivedAt?: string // Deprecated: use status='archived' instead
  createdAt: string
  updatedAt?: string // Optional for backwards compatibility
  // Computed fields (not stored, calculated from objectives)
  progress?: number // 0-100, calculated from completed objectives
  objectivesCount?: number
  completedObjectivesCount?: number
}

// Objectives within a Project (goals that can be marked complete)
export interface Objective {
  id: string
  projectId: string
  title: string
  description?: string
  status: ObjectiveStatus
  order: number
  dueDate?: string // Optional deadline for this objective
  completedAt?: string
  createdAt: string
  updatedAt: string
}

// Milestones - Key dates/checkpoints in the project timeline
export interface Milestone {
  id: string
  projectId: string
  title: string
  description?: string
  targetDate: string // Required date for the milestone (YYYY-MM-DD)
  status: MilestoneStatus
  completedAt?: string
  createdAt: string
  updatedAt: string
}

// Project-specific Metrics/KPIs
export interface ProjectMetric {
  id: string
  projectId: string
  name: string // e.g., "Users", "Revenue", "Tasks Completed"
  unit?: string // e.g., "users", "$", "tasks"
  targetValue?: number // Optional goal value
  currentValue: number
  createdAt: string
  updatedAt: string
}

// Metric history entry for tracking changes over time
export interface ProjectMetricEntry {
  id: string
  metricId: string
  value: number
  date: string // YYYY-MM-DD
  createdAt: string
}

// Project with computed progress and counts
export interface ProjectWithProgress extends Project {
  progress: number
  objectivesCount: number
  completedObjectivesCount: number
  milestonesCount: number
  upcomingMilestones: Milestone[]
  tasksCount: number
  completedTasksCount: number
  habitsCount: number
}

// Project summary for list views
export interface ProjectSummary {
  id: string
  title: string
  color: string
  icon?: string
  status: ProjectStatus
  dueDate?: string
  progress: number
  objectivesCount: number
  completedObjectivesCount: number
}

// Form data types for creating/updating
export interface CreateProjectData {
  title: string
  description?: string
  color?: string
  icon?: string
  dueDate?: string
  startDate?: string
}

export interface UpdateProjectData {
  title?: string
  description?: string
  color?: string
  icon?: string
  status?: ProjectStatus
  dueDate?: string
  startDate?: string
  archivedAt?: string // Deprecated: use status instead
}

export interface CreateObjectiveData {
  projectId: string
  title: string
  description?: string
  dueDate?: string
}

export interface UpdateObjectiveData {
  title?: string
  description?: string
  status?: ObjectiveStatus
  dueDate?: string
  order?: number
}

export interface CreateMilestoneData {
  projectId: string
  title: string
  description?: string
  targetDate: string
}

export interface UpdateMilestoneData {
  title?: string
  description?: string
  targetDate?: string
  status?: MilestoneStatus
}

export interface CreateProjectMetricData {
  projectId: string
  name: string
  unit?: string
  targetValue?: number
  currentValue?: number
}

export interface UpdateProjectMetricData {
  name?: string
  unit?: string
  targetValue?: number
  currentValue?: number
}

// Constants for UI
export const PROJECT_STATUS_OPTIONS: { value: ProjectStatus; labelKey: string }[] = [
  { value: 'active', labelKey: 'projects.status.active' },
  { value: 'paused', labelKey: 'projects.status.paused' },
  { value: 'completed', labelKey: 'projects.status.completed' },
  { value: 'archived', labelKey: 'projects.status.archived' },
]

export const PROJECT_ICONS = [
  'rocket',
  'target',
  'lightbulb',
  'code',
  'briefcase',
  'graduation-cap',
  'heart',
  'star',
  'flag',
  'trophy',
  'compass',
  'zap',
] as const

export type ProjectIcon = (typeof PROJECT_ICONS)[number]

export const PROJECT_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#ec4899', // pink
] as const

export type ProjectColor = (typeof PROJECT_COLORS)[number]
