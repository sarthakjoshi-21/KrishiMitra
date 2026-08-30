'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types/database'

export interface AuthResult {
  role: UserRole | null
  error: string | null
}

import { toFarmerEmail } from '@/lib/auth-helpers'

/** Sign in a Farmer using name + password */
export async function signInFarmer(
  name: string,
  password: string
): Promise<AuthResult> {
  try {
    const supabase = await getSupabaseServerClient()
    const email = toFarmerEmail(name)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { role: null, error: error.message }
    return { role: 'farmer', error: null }
  } catch (err) {
    return { role: null, error: String(err) }
  }
}

/** Sign in a Buyer using email + password */
export async function signInBuyer(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const supabase = await getSupabaseServerClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { role: null, error: error.message }
    return { role: 'buyer', error: null }
  } catch (err) {
    return { role: null, error: String(err) }
  }
}

/** Sign out current user */
export async function signOut(): Promise<{ error: string | null }> {
  try {
    const supabase = await getSupabaseServerClient()
    const { error } = await supabase.auth.signOut()
    return { error: error?.message ?? null }
  } catch (err) {
    return { error: String(err) }
  }
}

/** Get current session user + role from the public.users table */
export async function getSession(): Promise<{
  userId: string | null
  role: UserRole | null
  fullName: string | null
  error: string | null
}> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { userId: null, role: null, fullName: null, error: null }

    const { data, error } = await (supabase
      .from('users') as any)
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    const role = data?.role || user.user_metadata?.role || null
    const fullName = data?.full_name || user.user_metadata?.full_name || 'Farmer'

    return {
      userId: user.id,
      role,
      fullName,
      error: null,
    }
  } catch (err) {
    return { userId: null, role: null, fullName: null, error: String(err) }
  }
}

/** Sign up a new user */
export async function signUpUser(
  formData: FormData,
  role: 'farmer' | 'buyer'
): Promise<AuthResult> {
  try {
    const supabase = await getSupabaseServerClient()
    const nameOrEmail = String(formData.get('name') || '').trim()
    const password = String(formData.get('password') || '')
    const fullName = String(formData.get('fullName') || '').trim() || nameOrEmail

    let email = nameOrEmail
    if (role === 'farmer') {
      email = toFarmerEmail(nameOrEmail)
    }

    const { error } = await supabase.auth.signUp({
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
    return { role, error: null }
  } catch (err) {
    return { role: null, error: String(err) }
  }
}
