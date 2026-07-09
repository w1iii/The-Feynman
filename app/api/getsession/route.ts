import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '../../lib/supabase/auth-helper'
import { getCached, setCached, CacheKeys, CacheTTLs } from '../../lib/redis/cache'

export async function GET(_request: NextRequest) {
  const { user, supabase, error } = await requireUser()
  if (error) return error

  const cacheKey = CacheKeys.sessions(user.id)
  const cached = await getCached(cacheKey)
  if (cached) {
    return NextResponse.json(cached)
  }

  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('id, concept, created_at, status, final_score, score_label, score_description')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (sessionsError) {
    return NextResponse.json(
      { error: sessionsError.message },
      { status: 500 }
    )
  }

  const response = !sessions || sessions.length === 0
    ? { sessions: [], message: 'No sessions yet' }
    : { sessions }

  await setCached(cacheKey, response, CacheTTLs.sessions)

  return NextResponse.json(response)
}
