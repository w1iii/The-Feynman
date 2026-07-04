import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient } from '../../../lib/stripe/client'
import { requireUser } from '../../../lib/supabase/auth-helper'

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripeClient()
    const { user, supabase, error } = await requireUser()
    if (error) return error

    const body = await request.json()
    const priceId = body.priceId

    if (!priceId) {
      return NextResponse.json({ error: 'priceId is required' }, { status: 400 })
    }

    // Ensure we have a stripe customer for this user
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error', profileError)
    }

    let customerId = profile?.stripe_customer_id || null
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { user_id: user.id } })
      customerId = customer.id

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id)

      if (updateError) console.error('Failed to persist stripe_customer_id', updateError)
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/feynman/settings?session=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/feynman/settings?session=cancel`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Checkout error', err)
    return NextResponse.json({ error: 'Checkout creation failed' }, { status: 500 })
  }
}
