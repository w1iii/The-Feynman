import { createClient } from './server'
import { createClient as createDirectClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { requireEnv } from '../env'

export async function requireUser() {
  // If client passed an Authorization header, verify that token directly
  // (skips cookie parsing, still verified with Supabase Auth server)
  const headersList = await headers()
  const authHeader = headersList.get('authorization')
  const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined

  if (accessToken) {
    const supabase = createDirectClient(
      requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
      requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
      }
    )
    const { data: { user }, error } = await supabase.auth.getUser()
    if (!error && user) return { user, supabase, error: null }
  }

  // Fallback to cookie-based auth (existing behavior)
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), supabase: null, user: null }
  }

  return { user, supabase, error: null }
}
