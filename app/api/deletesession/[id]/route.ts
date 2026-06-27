
import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '../../../lib/supabase/auth-helper'
import { invalidateUserSessionsAndStats } from '../../../lib/redis/cache'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {

  const { id: sessionIdToDelete } = await params

  const { user, supabase, error } = await requireUser()
  if (error) return error

  // Fetch session and verify ownership
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionIdToDelete)
    .eq('user_id', user.id)
    .single()

  if (sessionError || !session) {
    return NextResponse.json(
      { error: 'Session not found or unauthorized' },
      { status: 404 }
    )
  }

  // Delete related messages first
  const { error: messagesError } = await supabase
    .from('messages')
    .delete()
    .eq('session_id', sessionIdToDelete)

  if (messagesError) {
    console.error('Failed to delete messages:', messagesError)
  }

  // Delete related criteria results
  const { error: criteriaError } = await supabase
    .from('criteria_results')
    .delete()
    .eq('session_id', sessionIdToDelete)

  if (criteriaError) {
    console.error('Failed to delete criteria results:', criteriaError)
  }

  // Delete the session
  const { error: deleteError } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionIdToDelete)

  if (deleteError) {
    return NextResponse.json(
      { error: 'Failed to delete session.' },
      { status: 500 }
    )
  }

  // Invalidate cached sessions and stats
  await invalidateUserSessionsAndStats(user.id)

  return NextResponse.json({
    messages: 'Session Deleted', 
    status: 200 
  })
}
