import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '../../../lib/supabase/auth-helper'

export async function POST(_request: NextRequest) {
  try {
    const { user, supabase, error } = await requireUser()
    if (error) return error

    // Fetch user's payment history
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('id, amount, status, reference_number, created_at, verified_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (paymentsError) {
      console.error('Portal: payment fetch error', paymentsError)
      return NextResponse.json({ error: 'Failed to fetch payment history' }, { status: 500 })
    }

    // Fetch profile for plan info
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, paymongo_customer_id, created_at')
      .eq('user_id', user.id)
      .maybeSingle()

    return NextResponse.json({
      plan: profile?.plan || 'free',
      payments: payments || [],
      member_since: profile?.created_at || null,
    })
  } catch (err) {
    console.error('Portal error', err)
    return NextResponse.json({ error: 'Failed to load billing info' }, { status: 500 })
  }
}
