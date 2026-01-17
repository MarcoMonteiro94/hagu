import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Configure web-push with VAPID keys (only if available)
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const isPushConfigured = !!(vapidPublicKey && vapidPrivateKey && supabaseUrl && supabaseServiceKey)

let supabaseAdmin: SupabaseClient | null = null

if (isPushConfigured) {
  webpush.setVapidDetails(
    'mailto:noreply@hagu.app',
    vapidPublicKey,
    vapidPrivateKey
  )

  // Create admin client for cron job (not user-scoped)
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
}

// i18n messages for push notifications
const messages = {
  'pt-BR': {
    habitReminder: 'Lembrete de Hábito',
    tasksDueToday: (count: number) =>
      count === 1 ? 'Tarefa para hoje' : `${count} tarefas para hoje`,
    tasksDueTomorrow: (count: number) =>
      count === 1 ? 'Tarefa para amanhã' : `${count} tarefas para amanhã`,
  },
  'en-US': {
    habitReminder: 'Habit Reminder',
    tasksDueToday: (count: number) =>
      count === 1 ? 'Task due today' : `${count} tasks due today`,
    tasksDueTomorrow: (count: number) =>
      count === 1 ? 'Task due tomorrow' : `${count} tasks due tomorrow`,
  },
}

type Locale = keyof typeof messages

function getMessages(locale: string): typeof messages['en-US'] {
  return messages[locale as Locale] || messages['en-US']
}

interface DbHabit {
  id: string
  user_id: string
  title: string
  reminder_time: string | null
  reminder_enabled: boolean
}

interface DbTask {
  id: string
  user_id: string
  title: string
  due_date: string | null
  status: 'pending' | 'in_progress' | 'done'
}

interface DbPushSubscription {
  user_id: string
  endpoint: string
  keys: unknown
}

interface DbUserSettings {
  user_id: string
  locale: string
}

// GET /api/push/reminders - Process scheduled reminders (called by cron)
export async function GET(request: NextRequest) {
  // Check if push notifications are configured
  if (!isPushConfigured || !supabaseAdmin) {
    return NextResponse.json(
      { error: 'Push notifications not configured' },
      { status: 503 }
    )
  }

  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    const currentTime = now.toTimeString().slice(0, 5) // HH:mm format
    const today = now.toISOString().split('T')[0]
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const results = {
      habitReminders: { sent: 0, failed: 0 },
      taskAlerts: { sent: 0, failed: 0 },
    }

    // Get all user settings for locale lookup
    const { data: allSettings } = await supabaseAdmin
      .from('user_settings')
      .select('user_id, locale')

    const userLocales = new Map<string, string>()
    ;((allSettings ?? []) as DbUserSettings[]).forEach((s) => {
      userLocales.set(s.user_id, s.locale)
    })

    // 1. Process habit reminders for current time
    const { data: habits, error: habitsError } = await supabaseAdmin
      .from('habits')
      .select('id, user_id, title, reminder_time, reminder_enabled')
      .eq('reminder_enabled', true)
      .eq('reminder_time', currentTime)
      .is('archived_at', null)

    if (habitsError) {
      console.error('Error fetching habits:', habitsError)
    } else if (habits && habits.length > 0) {
      const habitsByUser = groupByUserId(habits as DbHabit[])

      for (const [userId, userHabits] of Object.entries(habitsByUser)) {
        const subscriptions = await getUserSubscriptions(supabaseAdmin, userId)
        const locale = userLocales.get(userId) ?? 'en-US'
        const t = getMessages(locale)

        for (const habit of userHabits) {
          const payload = {
            title: t.habitReminder,
            body: habit.title,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            tag: `habit-${habit.id}`,
            data: {
              type: 'habit_reminder',
              habitId: habit.id,
              url: '/habits',
            },
          }

          const result = await sendToSubscriptions(supabaseAdmin, subscriptions, payload)
          results.habitReminders.sent += result.sent
          results.habitReminders.failed += result.failed
        }
      }
    }

    // 2. Process task due alerts (tasks due today or tomorrow)
    // Only check at specific times (e.g., 9:00 and 18:00)
    const alertTimes = ['09:00', '18:00']

    if (alertTimes.includes(currentTime)) {
      const { data: tasks, error: tasksError } = await supabaseAdmin
        .from('tasks')
        .select('id, user_id, title, due_date, status')
        .in('due_date', [today, tomorrow])
        .neq('status', 'done')

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError)
      } else if (tasks && tasks.length > 0) {
        const tasksByUser = groupByUserId(tasks as DbTask[])

        for (const [userId, userTasks] of Object.entries(tasksByUser)) {
          const subscriptions = await getUserSubscriptions(supabaseAdmin, userId)
          const locale = userLocales.get(userId) ?? 'en-US'
          const t = getMessages(locale)

          // Group tasks by due date for summary notification
          const todayTasks = userTasks.filter((task) => task.due_date === today)
          const tomorrowTasks = userTasks.filter((task) => task.due_date === tomorrow)

          if (todayTasks.length > 0) {
            const payload = {
              title: t.tasksDueToday(todayTasks.length),
              body: todayTasks.length === 1
                ? todayTasks[0].title
                : todayTasks.map((task) => task.title).join(', '),
              icon: '/icons/icon-192x192.png',
              badge: '/icons/badge-72x72.png',
              tag: 'tasks-today',
              data: {
                type: 'task_due_today',
                taskIds: todayTasks.map((task) => task.id),
                url: '/tasks',
              },
            }

            const result = await sendToSubscriptions(supabaseAdmin, subscriptions, payload)
            results.taskAlerts.sent += result.sent
            results.taskAlerts.failed += result.failed
          }

          if (tomorrowTasks.length > 0) {
            const payload = {
              title: t.tasksDueTomorrow(tomorrowTasks.length),
              body: tomorrowTasks.length === 1
                ? tomorrowTasks[0].title
                : tomorrowTasks.map((task) => task.title).join(', '),
              icon: '/icons/icon-192x192.png',
              badge: '/icons/badge-72x72.png',
              tag: 'tasks-tomorrow',
              data: {
                type: 'task_due_tomorrow',
                taskIds: tomorrowTasks.map((task) => task.id),
                url: '/tasks',
              },
            }

            const result = await sendToSubscriptions(supabaseAdmin, subscriptions, payload)
            results.taskAlerts.sent += result.sent
            results.taskAlerts.failed += result.failed
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      currentTime,
      results,
    })
  } catch (error) {
    console.error('Reminder processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process reminders' },
      { status: 500 }
    )
  }
}

// Helper: Group items by user_id
function groupByUserId<T extends { user_id: string }>(items: T[]): Record<string, T[]> {
  return items.reduce((acc, item) => {
    if (!acc[item.user_id]) {
      acc[item.user_id] = []
    }
    acc[item.user_id].push(item)
    return acc
  }, {} as Record<string, T[]>)
}

// Helper: Get user's push subscriptions
async function getUserSubscriptions(client: SupabaseClient, userId: string): Promise<DbPushSubscription[]> {
  const { data, error } = await client
    .from('push_subscriptions')
    .select('user_id, endpoint, keys')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching subscriptions for user:', userId, error)
    return []
  }

  return (data ?? []) as DbPushSubscription[]
}

// Helper: Send notification to all subscriptions
async function sendToSubscriptions(
  client: SupabaseClient,
  subscriptions: DbPushSubscription[],
  payload: Record<string, unknown>
): Promise<{ sent: number; failed: number }> {
  let sent = 0
  let failed = 0

  for (const sub of subscriptions) {
    try {
      const keys = sub.keys as { p256dh: string; auth: string }

      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
      }

      await webpush.sendNotification(
        pushSubscription,
        JSON.stringify(payload)
      )

      sent++
    } catch (err) {
      // If subscription is invalid (expired), remove it
      const webPushError = err as { statusCode?: number }
      if (webPushError.statusCode === 410) {
        await client
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', sub.endpoint)
      }
      failed++
    }
  }

  return { sent, failed }
}
