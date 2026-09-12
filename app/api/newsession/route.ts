import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '../../lib/supabase/auth-helper'
import { invalidateUserSessionsAndStats } from '../../lib/redis/cache'
import { rateLimit } from '../../lib/rate-limit'

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

  const { allowed } = await rateLimit(`newsession:${user.id}`, 10, 60)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait.' },
      { status: 429 }
    )
  }

  // Check user's profile plan
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('user_id', user.id)
    .single()

  const isPro = profile?.plan === 'pro'

  // Check daily usage BEFORE creating session (non-pro only)
  let dailyUsageIncremented = false
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

    // Increment usage atomically before session creation
    const { error: rpcError } = await supabase.rpc('increment_daily_usage', {
      p_user_id: user.id,
    })

    if (rpcError) {
      // Fallback if RPC function doesn't exist yet
      console.error('RPC increment_daily_usage failed, using fallback:', rpcError)
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
    dailyUsageIncremented = true
  }

  // Create session after rate limit check passes
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
    // Rollback daily usage increment if session creation failed
    if (dailyUsageIncremented) {
      const today = new Date().toISOString().split('T')[0]
      const { data: currentUsage } = await supabase
        .from('daily_usage')
        .select('sessions_used')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()

      if (currentUsage && currentUsage.sessions_used > 0) {
        await supabase
          .from('daily_usage')
          .update({ sessions_used: currentUsage.sessions_used - 1 })
          .eq('user_id', user.id)
          .eq('date', today)
      }
    }
    return NextResponse.json(
      { error: sessionError.message },
      { status: 500 }
    )
  }

  // Invalidate cached sessions and stats
  await invalidateUserSessionsAndStats(user.id)

  return NextResponse.json({
    id: data.id,
    concept: concept,
    status: 'active',
  })
}
