import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../lib/supabase/server'
import { getCached, setCached, CacheKeys, CacheTTLs } from '../../lib/redis/cache'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const cacheKey = CacheKeys.sessions(user.id)
  const cached = await getCached(cacheKey)
  if (cached) {
    return NextResponse.json(cached)
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

  const response = !sessions || sessions.length === 0
    ? { sessions: [], message: 'No sessions yet' }
    : { sessions }

  await setCached(cacheKey, response, CacheTTLs.sessions)

  return NextResponse.json(response)
}
