import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '../../lib/supabase/auth-helper'
import { getCached, setCached, CacheKeys, CacheTTLs } from '../../lib/redis/cache'

export async function GET(_request: NextRequest) {
  const { user, supabase, error } = await requireUser()
  if (error) return error

  const cacheKey = CacheKeys.stats(user.id)
  const cached = await getCached(cacheKey)
  if (cached) {
    console.log("Returning from cache", cached)
    return NextResponse.json(cached)
  }

  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('id, concept, created_at, status, final_score')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (sessionsError) {
    return NextResponse.json(
      { error: sessionsError.message },
      { status: 500 }
    )
  }

  const totalSessions = sessions?.length || 0
  const completedSessions = sessions?.filter(s => s.status === 'completed') || []
  const scoredSessions = completedSessions.filter(s => s.final_score !== null && s.final_score !== undefined)

  const avgScore = scoredSessions.length > 0
    ? scoredSessions.reduce((sum, s) => sum + (s.final_score || 0), 0) / scoredSessions.length
    : 0

  const uniqueConcepts = [...new Set(sessions?.map(s => s.concept) || [])]
  const recentConcepts = sessions?.slice(0, 5).map(s => s.concept) || []

  const bestScore = scoredSessions.length > 0
    ? Math.max(...scoredSessions.map(s => s.final_score || 0))
    : 0

  const completionRate = totalSessions > 0
    ? (completedSessions.length / totalSessions) * 100
    : 0

  const response = {
    total_sessions: totalSessions,
    completed_sessions: completedSessions.length,
    avg_score: Math.round(avgScore * 10) / 10,
    best_score: bestScore,
    completion_rate: Math.round(completionRate * 10) / 10,
    unique_concepts: uniqueConcepts.length,
    recent_concepts: recentConcepts,
  }

  await setCached(cacheKey, response, CacheTTLs.stats)

  return NextResponse.json(response)
}
