type NotificationPermissionState = 'granted' | 'denied' | 'default'

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) return 'denied'
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) return 'denied'

  try {
    const permission = await Notification.requestPermission()
    return permission
  } catch {
    return 'denied'
  }
}

interface SendNotificationOptions {
  title: string
  body: string
  icon?: string
  tag?: string
  onClick?: () => void
}

export function sendNotification({
  title,
  body,
  icon = '/icon-192x192.png',
  tag,
  onClick,
}: SendNotificationOptions): Notification | null {
  if (!isNotificationSupported()) return null
  if (Notification.permission !== 'granted') return null

  const notification = new Notification(title, {
    body,
    icon,
    tag,
    badge: icon,
  })

  if (onClick) {
    notification.onclick = () => {
      window.focus()
      onClick()
      notification.close()
    }
  }

  return notification
}

// Habit reminder notification
export function sendHabitReminder(habitTitle: string, habitId: string): void {
  sendNotification({
    title: 'Lembrete de Hábito',
    body: `Hora de completar: ${habitTitle}`,
    tag: `habit-${habitId}`,
    onClick: () => {
      window.location.href = '/habits'
    },
  })
}

// Task due notification
export function sendTaskDueReminder(taskTitle: string, taskId: string): void {
  sendNotification({
    title: 'Tarefa Pendente',
    body: `Vence hoje: ${taskTitle}`,
    tag: `task-${taskId}`,
    onClick: () => {
      window.location.href = '/tasks'
    },
  })
}

// Daily summary notification
export function sendDailySummary(
  habitsCount: number,
  tasksCount: number
): void {
  const parts: string[] = []
  if (habitsCount > 0) {
    parts.push(`${habitsCount} hábito${habitsCount > 1 ? 's' : ''}`)
  }
  if (tasksCount > 0) {
    parts.push(`${tasksCount} tarefa${tasksCount > 1 ? 's' : ''}`)
  }

  if (parts.length === 0) return

  sendNotification({
    title: 'Bom dia! 🌅',
    body: `Você tem ${parts.join(' e ')} para hoje.`,
    tag: 'daily-summary',
    onClick: () => {
      window.location.href = '/'
    },
  })
}
