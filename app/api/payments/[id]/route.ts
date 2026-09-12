import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireEnv } from '../../../lib/env'
import { invalidateCache, CacheKeys } from '../../../lib/redis/cache'

// Admin approves/rejects a payment
// Uses service_role key to bypass RLS
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, notes } = body

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Use service role for admin operations
    const supabase = createClient(
      requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
      requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Get payment
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (payment.status !== 'pending') {
      return NextResponse.json({ error: 'Payment already processed' }, { status: 409 })
    }

    // Update payment status
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status,
        notes: notes || null,
        verified_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error('Payment update error', updateError)
      return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 })
    }

    // If approved, upgrade user to pro
    if (status === 'approved') {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ plan: 'pro' })
        .eq('user_id', payment.user_id)

      if (profileError) {
        console.error('Profile upgrade error', profileError)
      } else {
        await invalidateCache(CacheKeys.profile(payment.user_id))
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin PATCH error', err)
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 })
  }
}
