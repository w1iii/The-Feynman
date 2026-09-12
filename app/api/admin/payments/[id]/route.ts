import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEnv } from '../../../../lib/env'
import { invalidateCache, CacheKeys } from '../../../../lib/redis/cache'
import { isAdmin } from '../../../../lib/admin-auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const { status, notes } = await request.json()

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const supabase = createClient(
      requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
      requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: payment, error: fetchErr } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchErr || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (payment.status !== 'pending') {
      return NextResponse.json({ error: 'Payment already processed' }, { status: 409 })
    }

    const { error: updateErr } = await supabase
      .from('payments')
      .update({
        status,
        notes: notes || null,
        verified_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateErr) {
      console.error('Payment update error', updateErr)
      return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 })
    }

    // If approved, upgrade user to pro
    if (status === 'approved') {
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ plan: 'pro' })
        .eq('user_id', payment.user_id)

      if (profileErr) {
        console.error('Profile upgrade error', profileErr)
      } else {
        // Invalidate profile cache so user sees updated plan
        await invalidateCache(CacheKeys.profile(payment.user_id))
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin PATCH error', err)
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 })
  }
}
