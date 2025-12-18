import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import type { Task, TaskStatus, Project } from '@/types'

interface TasksState {
  tasks: Task[]
  projects: Project[]

  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'subtasks'>) => void
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void
  deleteTask: (id: string) => void
  setTaskStatus: (id: string, status: TaskStatus) => void
  toggleSubtask: (taskId: string, subtaskId: string) => void
  addSubtask: (taskId: string, title: string) => void
  deleteSubtask: (taskId: string, subtaskId: string) => void

  // Project actions
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => void
  updateProject: (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => void
  deleteProject: (id: string) => void
  archiveProject: (id: string) => void

  // Queries
  getTaskById: (id: string) => Task | undefined
  getTasksByProject: (projectId: string) => Task[]
  getTasksByArea: (areaId: string) => Task[]
  getTasksByStatus: (status: TaskStatus) => Task[]
  getTasksForDate: (date: string) => Task[]
  getTodayTasks: () => Task[]
  getProjectById: (id: string) => Project | undefined
  reorderTasks: (activeId: string, overId: string) => void
}

function generateId(): string {
  return crypto.randomUUID()
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

export const useTasksStore = create<TasksState>()(
  persist(
    (set, get) => ({
      tasks: [],
      projects: [],

      // Task actions
      addTask: (taskData) => {
        const task: Task = {
          ...taskData,
          id: generateId(),
          createdAt: new Date().toISOString(),
          subtasks: [],
        }
        set((state) => ({ tasks: [...state.tasks, task] }))
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...updates } : task
          ),
        }))
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }))
      },

      setTaskStatus: (id, status) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? {
                  ...task,
                  status,
                  completedAt: status === 'done' ? new Date().toISOString() : undefined,
                }
              : task
          ),
        }))
      },

      toggleSubtask: (taskId, subtaskId) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  subtasks: task.subtasks.map((st) =>
                    st.id === subtaskId ? { ...st, done: !st.done } : st
                  ),
                }
              : task
          ),
        }))
      },

      addSubtask: (taskId, title) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  subtasks: [
                    ...task.subtasks,
                    { id: generateId(), title, done: false },
                  ],
                }
              : task
          ),
        }))
      },

      deleteSubtask: (taskId, subtaskId) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  subtasks: task.subtasks.filter((st) => st.id !== subtaskId),
                }
              : task
          ),
        }))
      },

      // Project actions
      addProject: (projectData) => {
        const project: Project = {
          ...projectData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ projects: [...state.projects, project] }))
      },

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === id ? { ...project, ...updates } : project
          ),
        }))
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((project) => project.id !== id),
          // Also remove project reference from tasks
          tasks: state.tasks.map((task) =>
            task.projectId === id ? { ...task, projectId: undefined } : task
          ),
        }))
      },

      archiveProject: (id) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === id
              ? { ...project, archivedAt: new Date().toISOString() }
              : project
          ),
        }))
      },

      // Queries
      getTaskById: (id) => get().tasks.find((task) => task.id === id),

      getTasksByProject: (projectId) =>
        get().tasks.filter((task) => task.projectId === projectId),

      getTasksByArea: (areaId) =>
        get().tasks.filter((task) => task.areaId === areaId),

      getTasksByStatus: (status) =>
        get().tasks.filter((task) => task.status === status),

      getTasksForDate: (date) =>
        get().tasks.filter((task) => task.dueDate === date && task.status !== 'done'),

      getTodayTasks: () => {
        const today = getTodayString()
        return get().tasks.filter(
          (task) => task.dueDate === today && task.status !== 'done'
        )
      },

      getProjectById: (id) => get().projects.find((project) => project.id === id),

      reorderTasks: (activeId, overId) => {
        set((state) => {
          const oldIndex = state.tasks.findIndex((t) => t.id === activeId)
          const newIndex = state.tasks.findIndex((t) => t.id === overId)

          if (oldIndex === -1 || newIndex === -1) return state

          const newTasks = [...state.tasks]
          const [movedTask] = newTasks.splice(oldIndex, 1)
          newTasks.splice(newIndex, 0, movedTask)

          return { tasks: newTasks }
        })
      },
    }),
    {
      name: 'hagu-tasks',
    }
  )
)

// Selector hooks
export function useTodayTasks(): Task[] {
  const today = getTodayString()
  return useTasksStore(
    useShallow((state) =>
      state.tasks.filter((task) => task.dueDate === today && task.status !== 'done')
    )
  )
}

export function usePendingTasks(): Task[] {
  return useTasksStore(
    useShallow((state) => state.tasks.filter((task) => task.status === 'pending'))
  )
}
