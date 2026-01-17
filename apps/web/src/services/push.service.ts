// Push Notifications Service - Subscription management

import type { SupabaseClient } from '@supabase/supabase-js'
import type { PushSubscriptionData, PushSubscriptionKeys } from '@/lib/push'

// Database row types
interface DbPushSubscription {
  id: string
  user_id: string
  endpoint: string
  keys: unknown
  created_at: string
}

export const pushService = {
  async saveSubscription(
    supabase: SupabaseClient,
    subscription: PushSubscriptionData
  ): Promise<void> {
    // Upsert subscription (update if exists, insert if not)
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
        },
        {
          onConflict: 'endpoint',
        }
      )

    if (error) throw error
  },

  async deleteSubscription(supabase: SupabaseClient, endpoint: string): Promise<void> {
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)

    if (error) throw error
  },

  async getUserSubscriptions(supabase: SupabaseClient): Promise<PushSubscriptionData[]> {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('endpoint, keys')

    if (error) throw error

    return ((data ?? []) as Pick<DbPushSubscription, 'endpoint' | 'keys'>[]).map((sub) => ({
      endpoint: sub.endpoint,
      keys: sub.keys as PushSubscriptionKeys,
    }))
  },

  async hasActiveSubscription(supabase: SupabaseClient): Promise<boolean> {
    const { count, error } = await supabase
      .from('push_subscriptions')
      .select('*', { count: 'exact', head: true })

    if (error) return false

    return (count ?? 0) > 0
  },
}
