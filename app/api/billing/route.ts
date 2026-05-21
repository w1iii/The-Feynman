import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../lib/supabase/server'

export async function GET(_request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get count of sessions for billing/usage display
    const { data, count, error } = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: false })
      .eq('user_id', user.id)

    if (error) {
      console.error('Billing route: session count error', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const total_sessions = typeof count === 'number' ? count : (data ? data.length : 0)

    return NextResponse.json({ total_sessions })
  } catch (err) {
    console.error('Billing GET error', err)
    return NextResponse.json({ error: 'Failed to fetch billing info' }, { status: 500 })
  }
}
