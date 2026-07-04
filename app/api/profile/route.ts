import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '../../lib/supabase/auth-helper'
import { getCached, setCached, CacheKeys, CacheTTLs, invalidateCache } from '../../lib/redis/cache'

export async function GET(_request: NextRequest) {
  const { user, supabase, error } = await requireUser()
  if (error) return error

  const cacheKey = CacheKeys.profile(user.id)
  const cached = await getCached(cacheKey)
  if (cached) {
    return NextResponse.json(cached)
  }

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('user_id', user.id)
      .maybeSingle()

  const response = {
    plan: profile?.plan || 'free',
    display_name: user.user_metadata?.full_name || '',
  }

  await setCached(cacheKey, response, CacheTTLs.profile)

  return NextResponse.json(response)
}

export async function PUT(request: NextRequest) {
  const { user, supabase, error } = await requireUser()
  if (error) return error

  const body = await request.json()
  const { display_name } = body

  if (!display_name || typeof display_name !== 'string') {
    return NextResponse.json(
      { error: 'Display name is required' },
      { status: 400 }
    )
  }

  const { error: updateError } = await supabase.auth.updateUser({
    data: { full_name: display_name.trim() }
  })

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message },
      { status: 500 }
    )
  }

  await invalidateCache(CacheKeys.profile(user.id))

  return NextResponse.json({
    display_name: display_name.trim(),
  })
}
