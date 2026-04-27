import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  if (!sessions || sessions.length === 0) {
    return NextResponse.json(
      { sessions: [], message: 'No sessions yet' },
      { status: 200 }
    )
  }

  return NextResponse.json({
    sessions: sessions,
  })
}
