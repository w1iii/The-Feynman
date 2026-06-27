import { createClient } from './server'
import { NextResponse } from 'next/server'

export async function requireUser() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), supabase: null, user: null }
  }

  return { user, supabase, error: null }
}
