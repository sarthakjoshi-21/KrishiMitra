'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { AppNotification } from '@/types/database'

export interface ActionResult<T = null> {
  data: T | null
  error: string | null
}

/** Get notifications for the logged-in user */
export async function getNotificationsForUser(): Promise<ActionResult<AppNotification[]>> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    let userId = user?.id
    if (!userId) {
      // Fallback in demo mode
      const { data: fallbackUser } = await (supabase.from('users') as any)
        .select('id')
        .limit(1)
        .maybeSingle()
      userId = fallbackUser?.id
    }

    if (!userId) return { data: [], error: null }

    const { data, error } = await (supabase
      .from('notifications') as any)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      // Return empty array gracefully if table is not yet created
      return { data: [], error: null }
    }

    return { data: (data as AppNotification[]) || [], error: null }
  } catch (err) {
    return { data: [], error: null }
  }
}

/** Mark a specific notification as read */
export async function markNotificationRead(notificationId: string): Promise<ActionResult> {
  try {
    const supabase = await getSupabaseServerClient()
    const { error } = await (supabase
      .from('notifications') as any)
      .update({ is_read: true })
      .eq('id', notificationId)

    if (error) return { data: null, error: error.message }
    revalidatePath('/')
    return { data: null, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}

/** Create notification for a user */
export async function createNotification(userId: string, message: string): Promise<ActionResult<{ id: string }>> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data, error } = await (supabase
      .from('notifications') as any)
      .insert({
        user_id: userId,
        message,
        is_read: false,
      })
      .select('id')
      .single()

    if (error) return { data: null, error: error.message }
    revalidatePath('/')
    return { data: { id: data.id }, error: null }
  } catch (err) {
    return { data: null, error: String(err) }
  }
}
