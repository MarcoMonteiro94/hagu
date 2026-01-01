import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'

// Configure web-push with VAPID keys (only if available)
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
const isPushConfigured = !!(vapidPublicKey && vapidPrivateKey)

if (isPushConfigured) {
  webpush.setVapidDetails(
    'mailto:noreply@hagu.app',
    vapidPublicKey,
    vapidPrivateKey
  )
}

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, unknown>
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

interface SendNotificationRequest {
  userId?: string
  endpoint?: string
  payload: PushNotificationPayload
}

// POST /api/push - Send push notification
export async function POST(request: NextRequest) {
  try {
    // Check if push notifications are configured
    if (!isPushConfigured) {
      return NextResponse.json(
        { error: 'Push notifications not configured' },
        { status: 503 }
      )
    }

    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: SendNotificationRequest = await request.json()
    const { userId, endpoint, payload } = body

    // Determine target - either specific user or specific endpoint
    let subscriptions: Array<{ endpoint: string; keys: unknown }> = []

    if (endpoint) {
      // Send to specific endpoint
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('endpoint, keys')
        .eq('endpoint', endpoint)
        .single()

      if (error || !data) {
        return NextResponse.json(
          { error: 'Subscription not found' },
          { status: 404 }
        )
      }

      subscriptions = [data]
    } else if (userId) {
      // Send to all subscriptions for a user
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('endpoint, keys')
        .eq('user_id', userId)

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch subscriptions' },
          { status: 500 }
        )
      }

      subscriptions = data ?? []
    } else {
      // Send to current user's subscriptions
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('endpoint, keys')
        .eq('user_id', user.id)

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch subscriptions' },
          { status: 500 }
        )
      }

      subscriptions = data ?? []
    }

    if (subscriptions.length === 0) {
      return NextResponse.json(
        { success: true, sent: 0, message: 'No subscriptions found' }
      )
    }

    // Send notifications to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const keys = sub.keys as { p256dh: string; auth: string }

        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: keys.p256dh,
            auth: keys.auth,
          },
        }

        const notificationPayload = JSON.stringify(payload)

        try {
          await webpush.sendNotification(pushSubscription, notificationPayload)
          return { success: true, endpoint: sub.endpoint }
        } catch (err) {
          // If subscription is invalid (expired), remove it
          const webPushError = err as { statusCode?: number }
          if (webPushError.statusCode === 410) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', sub.endpoint)
          }
          throw err
        }
      })
    )

    const successful = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    return NextResponse.json({
      success: true,
      sent: successful,
      failed,
      total: subscriptions.length,
    })
  } catch (error) {
    console.error('Push notification error:', error)
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    )
  }
}
