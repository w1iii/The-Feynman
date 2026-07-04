import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '../../lib/supabase/auth-helper'
import { invalidateUserSessionsAndStats } from '../../lib/redis/cache'

export async function POST(request: NextRequest) {
  const { concept } = await request.json()

  if (!concept) {
    return NextResponse.json(
      { error: 'Concept is required' },
      { status: 400 }
    )
  }

  const { user, supabase, error } = await requireUser()
  if (error) return error

  // Check user's profile plan
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('user_id', user.id)
    .single()

  const isPro = profile?.plan === 'pro'

  // Check daily usage limit only for non-pro users
  if (!isPro) {
    const today = new Date().toISOString().split('T')[0]
    
    const { data: usage } = await supabase
      .from('daily_usage')
      .select('sessions_used')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    if (usage && usage.sessions_used >= 3) {
      return NextResponse.json(
        { error: 'Daily limit reached', upgrade: true },
        { status: 403 }
      )
    }
  }

  // Create session
  const { data, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      concept: concept,
      status: 'active',
      question_count: 0,
    })
    .select('id')
    .single()

  if (sessionError) {
    return NextResponse.json(
      { error: sessionError.message },
      { status: 500 }
    )
  }

  // Increment daily usage atomically for non-pro users
  if (!isPro) {
    const { error: rpcError } = await supabase.rpc('increment_daily_usage', {
      p_user_id: user.id,
    })

    if (rpcError) {
      // Fallback if RPC function doesn't exist yet
      console.error('RPC increment_daily_usage failed, using fallback:', rpcError)
      const today = new Date().toISOString().split('T')[0]
      const { data: usage } = await supabase
        .from('daily_usage')
        .select('sessions_used')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()

      if (usage) {
        await supabase
          .from('daily_usage')
          .update({ sessions_used: usage.sessions_used + 1 })
          .eq('user_id', user.id)
          .eq('date', today)
      } else {
        await supabase
          .from('daily_usage')
          .insert({ user_id: user.id, date: today, sessions_used: 1 })
      }
    }
  }

  // Invalidate cached sessions and stats
  await invalidateUserSessionsAndStats(user.id)

  return NextResponse.json({
    id: data.id,
    concept: concept,
    status: 'active',
  })
}
