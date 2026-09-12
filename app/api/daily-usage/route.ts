import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '../../lib/supabase/auth-helper'

export async function GET(_request: NextRequest) {
  const { user, supabase, error } = await requireUser()
  if (error) return error

  const today = new Date().toISOString().split('T')[0]

  const { data: usage, error: usageError } = await supabase
    .from('daily_usage')
    .select('sessions_used')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  if (usageError && usageError.code !== 'PGRST116') {
    return NextResponse.json(
      { error: usageError.message },
      { status: 500 }
    )
  }

  return NextResponse.json({ sessions_used: usage?.sessions_used || 0 })
}
