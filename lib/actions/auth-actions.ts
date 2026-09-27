'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/database'

export interface AuthResult {
  role: UserRole | null
  error: string | null
  user?: any
}

/** Generic sign-in using real email + password */
export async function signInUser(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const supabase = await getSupabaseServerClient()
    const cleanEmail = email.trim().toLowerCase()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    })

    if (error) {
      return { role: null, error: error.message }
    }

    if (!data.user) {
      return { role: null, error: 'User session not found.' }
    }

    // Retrieve role from public.users or user_metadata
    const { data: profile } = await (supabase
      .from('users') as any)
      .select('role, full_name')
      .eq('id', data.user.id)
      .maybeSingle()

    const role = (profile?.role || data.user.user_metadata?.role || 'farmer') as UserRole

    return { role, error: null, user: data.user }
  } catch (err: any) {
    return { role: null, error: err?.message || String(err) }
  }
}

/** Sign in a Farmer using real email + password */
export async function signInFarmer(
  email: string,
  password: string
): Promise<AuthResult> {
  return signInUser(email, password)
}

/** Sign in a Buyer using real email + password */
export async function signInBuyer(
  email: string,
  password: string
): Promise<AuthResult> {
  return signInUser(email, password)
}

/** Sign out current user */
export async function signOut(): Promise<{ error: string | null }> {
  try {
    const supabase = await getSupabaseServerClient()
    const { error } = await supabase.auth.signOut()
    return { error: error?.message ?? null }
  } catch (err: any) {
    return { error: err?.message || String(err) }
  }
}

/** Get current session user + role */
export async function getSession(): Promise<{
  userId: string | null
  role: UserRole | null
  fullName: string | null
  email: string | null
  error: string | null
}> {
  try {
    const supabase = await getSupabaseServerClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { userId: null, role: null, fullName: null, email: null, error: null }
    }

    const { data: profile } = await (supabase
      .from('users') as any)
      .select('role, full_name')
      .eq('id', user.id)
      .maybeSingle()

    const role = (profile?.role || user.user_metadata?.role || 'farmer') as UserRole
    const fullName =
      profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Farmer'

    return {
      userId: user.id,
      role,
      fullName,
      email: user.email ?? null,
      error: null,
    }
  } catch (err: any) {
    return { userId: null, role: null, fullName: null, email: null, error: err?.message || String(err) }
  }
}

/** Sign up a new user with real email, password, and metadata */
export async function signUpUser(
  emailOrFormData: string | FormData,
  passwordOrRole?: string | 'farmer' | 'buyer',
  roleParam?: 'farmer' | 'buyer',
  fullNameParam?: string
): Promise<AuthResult> {
  try {
    const supabase = await getSupabaseServerClient()
    let email = ''
    let password = ''
    let role: 'farmer' | 'buyer' = 'farmer'
    let fullName = ''

    if (typeof emailOrFormData === 'object' && 'get' in emailOrFormData) {
      const fd = emailOrFormData as FormData
      email = String(fd.get('email') || fd.get('name') || '').trim().toLowerCase()
      password = String(fd.get('password') || '')
      role = (passwordOrRole as 'farmer' | 'buyer') || (String(fd.get('role')) as 'farmer' | 'buyer') || 'farmer'
      fullName = String(fd.get('fullName') || fd.get('full_name') || '').trim() || email.split('@')[0]
    } else {
      email = String(emailOrFormData).trim().toLowerCase()
      password = String(passwordOrRole || '')
      role = roleParam || 'farmer'
      fullName = fullNameParam || email.split('@')[0]
    }

    if (!email) return { role: null, error: 'Email address is required.' }
    if (!password || password.length < 6) return { role: null, error: 'Password must be at least 6 characters.' }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          full_name: fullName,
        },
      },
    })

    if (error) return { role: null, error: error.message }

    // Ensure record exists in public.users table for joins/FKs
    if (data.user?.id) {
      try {
        await (supabase.from('users') as any).upsert(
          {
            id: data.user.id,
            email: data.user.email || email,
            role,
            full_name: fullName,
            created_at: new Date().toISOString(),
          },
          { onConflict: 'id' }
        )
      } catch (upsertErr) {
        console.warn('[signUpUser] public.users upsert warning:', upsertErr)
      }
    }

    return { role, error: null, user: data.user }
  } catch (err: any) {
    return { role: null, error: err?.message || String(err) }
  }
}

