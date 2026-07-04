import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '../../lib/supabase/auth-helper'
import { getCached, setCached, CacheKeys, CacheTTLs } from '../../lib/redis/cache'

export async function GET(_request: NextRequest) {
  const { user, supabase, error } = await requireUser()
  if (error) return error

  const cacheKey = CacheKeys.billing(user.id)
  const cached = await getCached(cacheKey)
  if (cached) {
    return NextResponse.json(cached)
  }

  try {
    const { data, count, error } = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: false })
      .eq('user_id', user.id)

    if (error) {
      console.error('Billing route: session count error', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const total_sessions = typeof count === 'number' ? count : (data ? data.length : 0)
    const response = { total_sessions }

    await setCached(cacheKey, response, CacheTTLs.billing)

    return NextResponse.json(response)
  } catch (err) {
    console.error('Billing GET error', err)
    return NextResponse.json({ error: 'Failed to fetch billing info' }, { status: 500 })
  }
}
