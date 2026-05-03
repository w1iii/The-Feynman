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

  // Fetch all sessions for the user
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

  // Calculate average score
  const avgScore = scoredSessions.length > 0
    ? scoredSessions.reduce((sum, s) => sum + (s.final_score || 0), 0) / scoredSessions.length
    : 0

  // Get unique concepts
  const uniqueConcepts = [...new Set(sessions?.map(s => s.concept) || [])]

  // Get recent concepts (last 5)
  const recentConcepts = sessions?.slice(0, 5).map(s => s.concept) || []

  // Calculate best score
  const bestScore = scoredSessions.length > 0
    ? Math.max(...scoredSessions.map(s => s.final_score || 0))
    : 0

  // Calculate completion rate
  const completionRate = totalSessions > 0
    ? (completedSessions.length / totalSessions) * 100
    : 0

  return NextResponse.json({
    total_sessions: totalSessions,
    completed_sessions: completedSessions.length,
    avg_score: Math.round(avgScore * 10) / 10,
    best_score: bestScore,
    completion_rate: Math.round(completionRate * 10) / 10,
    unique_concepts: uniqueConcepts.length,
    recent_concepts: recentConcepts,
  })
}
