import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEnv } from '../../../lib/env'

function isAdmin(request: NextRequest) {
  return request.cookies.get('admin_token')?.value === '1'
}

export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createClient(
      requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
      requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Get payments with user emails via a join
    const { data: payments, error: payErr } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })

    if (payErr) {
      console.error('Admin payments fetch error', payErr)
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
    }

    // Fetch emails separately to avoid FK issues
    const userIds = [...new Set((payments || []).map(p => p.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, email')
      .in('user_id', userIds)

    const profileMap = new Map((profiles || []).map(p => [p.user_id, p.email]))

    const enriched = (payments || []).map(p => ({
      ...p,
      email: profileMap.get(p.user_id) || null,
    }))

    return NextResponse.json({ payments: enriched })
  } catch (err) {
    console.error('Admin payments error', err)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}
