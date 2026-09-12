import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '../../lib/supabase/auth-helper'

// User submits a manual GCash payment
export async function POST(request: NextRequest) {
  try {
    const { user, supabase, error } = await requireUser()
    if (error) return error

    const body = await request.json()
    const amount = body.amount || 49900 // default ₱499 in centavos
    const referenceNumber = body.reference_number

    if (!amount || amount < 100) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    if (!referenceNumber || !referenceNumber.trim()) {
      return NextResponse.json({ error: 'Reference number required' }, { status: 400 })
    }

    // Check for existing pending payment
    const { data: existing } = await supabase
      .from('payments')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single()

    if (existing) {
      return NextResponse.json({ error: 'You already have a pending payment' }, { status: 409 })
    }

    const { data, error: insertError } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        amount,
        reference_number: referenceNumber.trim(),
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Payment insert error', insertError)
      return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
    }

    return NextResponse.json({ payment: data })
  } catch (err) {
    console.error('Payment POST error', err)
    return NextResponse.json({ error: 'Payment submission failed' }, { status: 500 })
  }
}

// User views own payments
export async function GET(_request: NextRequest) {
  try {
    const { user, supabase, error } = await requireUser()
    if (error) return error

    const { data, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Payment fetch error', fetchError)
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
    }

    return NextResponse.json({ payments: data })
  } catch (err) {
    console.error('Payment GET error', err)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}
