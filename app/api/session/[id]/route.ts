import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params
  const supabase = await createClient()

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Fetch session and verify ownership
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (sessionError || !session) {
    return NextResponse.json(
      { error: 'Session not found or unauthorized' },
      { status: 404 }
    )
  }

  // Fetch messages for this session
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('turn_number', { ascending: true })

  if (messagesError) {
    return NextResponse.json(
      { error: 'Failed to load messages' },
      { status: 500 }
    )
  }

  // Fetch criteria results
  const { data: criteriaResults, error: criteriaError } = await supabase
    .from('criteria_results')
    .select('*')
    .eq('session_id', sessionId)
    .order('criterion_index', { ascending: true })

  if (criteriaError) {
    return NextResponse.json(
      { error: 'Failed to load criteria results' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    session,
    messages: messages ?? [],
    criteria_results: criteriaResults ?? [],
  })
}