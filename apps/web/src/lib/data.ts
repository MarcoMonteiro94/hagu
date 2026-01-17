import type { AppData } from '@/types'

const APP_VERSION = '0.1.0'

const STORAGE_KEYS = [
  'hagu-habits',
  'hagu-tasks',
  'hagu-areas',
  'hagu-gamification',
  'hagu-settings',
] as const

export function exportData(): AppData {
  const data: Record<string, unknown> = {}

  STORAGE_KEYS.forEach((key) => {
    const stored = localStorage.getItem(key)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        data[key] = parsed.state || parsed
      } catch {
        // Skip if can't parse
      }
    }
  })

  return {
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    habits: (data['hagu-habits'] as { habits?: unknown[] })?.habits || [],
    tasks: (data['hagu-tasks'] as { tasks?: unknown[] })?.tasks || [],
    projects: (data['hagu-tasks'] as { projects?: unknown[] })?.projects || [],
    areas: (data['hagu-areas'] as { areas?: unknown[] })?.areas || [],
    metrics: (data['hagu-areas'] as { metrics?: unknown[] })?.metrics || [],
    achievements: (data['hagu-gamification'] as { achievements?: unknown[] })?.achievements || [],
    streaks: (data['hagu-gamification'] as { streaks?: unknown[] })?.streaks || [],
    stats: {
      totalXp: (data['hagu-gamification'] as { totalXp?: number })?.totalXp || 0,
      level: (data['hagu-gamification'] as { level?: number })?.level || 1,
      habitsCompleted: (data['hagu-gamification'] as { totalHabitsCompleted?: number })?.totalHabitsCompleted || 0,
      tasksCompleted: (data['hagu-gamification'] as { totalTasksCompleted?: number })?.totalTasksCompleted || 0,
      currentStreak: (data['hagu-gamification'] as { currentStreak?: number })?.currentStreak || 0,
      longestStreak: (data['hagu-gamification'] as { longestStreak?: number })?.longestStreak || 0,
    },
    settings: {
      theme: (data['hagu-settings'] as { theme?: 'dark' | 'light' | 'system' })?.theme || 'dark',
      locale: (data['hagu-settings'] as { locale?: 'pt-BR' | 'en-US' })?.locale || 'pt-BR',
      weekStartsOn: (data['hagu-settings'] as { weekStartsOn?: 0 | 1 })?.weekStartsOn || 0,
      notificationsEnabled: (data['hagu-settings'] as { notificationsEnabled?: boolean })?.notificationsEnabled || false,
    },
  } as AppData
}

export function downloadData(): void {
  const data = exportData()
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const date = new Date().toISOString().split('T')[0]
  const filename = `hagu-backup-${date}.json`

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function importData(file: File): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const data = JSON.parse(content) as AppData

        // Validate data structure
        if (!data.version || !data.exportedAt) {
          resolve({ success: false, error: 'Invalid backup file format' })
          return
        }

        // Import habits
        if (data.habits && Array.isArray(data.habits)) {
          const habitsStore = { state: { habits: data.habits }, version: 0 }
          localStorage.setItem('hagu-habits', JSON.stringify(habitsStore))
        }

        // Import tasks and projects
        if (data.tasks || data.projects) {
          const tasksStore = {
            state: {
              tasks: data.tasks || [],
              projects: data.projects || [],
            },
            version: 0,
          }
          localStorage.setItem('hagu-tasks', JSON.stringify(tasksStore))
        }

        // Import areas and metrics
        if (data.areas || data.metrics) {
          const areasStore = {
            state: {
              areas: data.areas || [],
              metrics: data.metrics || [],
            },
            version: 0,
          }
          localStorage.setItem('hagu-areas', JSON.stringify(areasStore))
        }

        // Import gamification data
        if (data.stats || data.achievements || data.streaks) {
          const gamificationStore = {
            state: {
              totalXp: data.stats?.totalXp || 0,
              level: data.stats?.level || 1,
              currentStreak: data.stats?.currentStreak || 0,
              longestStreak: data.stats?.longestStreak || 0,
              totalHabitsCompleted: data.stats?.habitsCompleted || 0,
              totalTasksCompleted: data.stats?.tasksCompleted || 0,
              achievements: data.achievements || [],
              streaks: data.streaks || [],
            },
            version: 0,
          }
          localStorage.setItem('hagu-gamification', JSON.stringify(gamificationStore))
        }

        // Import settings
        if (data.settings) {
          const settingsStore = {
            state: {
              theme: data.settings.theme || 'dark',
              locale: data.settings.locale || 'pt-BR',
              weekStartsOn: data.settings.weekStartsOn || 0,
              notificationsEnabled: data.settings.notificationsEnabled || false,
            },
            version: 0,
          }
          localStorage.setItem('hagu-settings', JSON.stringify(settingsStore))
        }

        resolve({ success: true })
      } catch {
        resolve({ success: false, error: 'Failed to parse backup file' })
      }
    }

    reader.onerror = () => {
      resolve({ success: false, error: 'Failed to read file' })
    }

    reader.readAsText(file)
  })
}

export function clearAllData(): void {
  STORAGE_KEYS.forEach((key) => {
    localStorage.removeItem(key)
  })
}
