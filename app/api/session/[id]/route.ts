import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '../../../lib/supabase/auth-helper'
import { getCached, setCached, CacheKeys, CacheTTLs } from '../../../lib/redis/cache'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params
  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
  }

  const { user, supabase, error } = await requireUser()
  if (error) return error

  const cacheKey = CacheKeys.sessionDetail(sessionId)
  const cached = await getCached(cacheKey)
  if (cached) {
    return NextResponse.json(cached)
  }

  const [sessionResult, messagesResult, criteriaResult] = await Promise.all([
    supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('turn_number', { ascending: true }),
    supabase
      .from('criteria_results')
      .select('criterion_index, passed')
      .eq('session_id', sessionId)
      .order('criterion_index', { ascending: true }),
  ])

  if (sessionResult.error || !sessionResult.data) {
    return NextResponse.json(
      { error: 'Session not found or unauthorized' },
      { status: 404 }
    )
  }

  if (messagesResult.error) {
    return NextResponse.json(
      { error: 'Failed to load messages' },
      { status: 500 }
    )
  }

  if (criteriaResult.error) {
    return NextResponse.json(
      { error: 'Failed to load criteria results' },
      { status: 500 }
    )
  }

  const response = {
    session: sessionResult.data,
    messages: messagesResult.data ?? [],
    criteria_results: criteriaResult.data ?? [],
  }

  await setCached(cacheKey, response, CacheTTLs.sessionDetail)

  return NextResponse.json(response)
}