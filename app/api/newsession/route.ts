import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../lib/supabase/server'
import { invalidateUserSessionsAndStats } from '../../lib/redis/cache'

export async function POST(request: NextRequest) {
  const { concept } = await request.json()

  if (!concept) {
    return NextResponse.json(
      { error: 'Concept is required' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  // Get current user from auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Check user's profile plan
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const isPremium = profile?.plan === 'premium'

  // Check daily usage limit only for non-premium users
  if (!isPremium) {
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
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      concept: concept,
      status: 'active',
      question_count: 0,
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  // Increment daily usage only for non-premium users
  if (!isPremium) {
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
        .insert({
          user_id: user.id,
          date: today,
          sessions_used: 1,
        })
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
