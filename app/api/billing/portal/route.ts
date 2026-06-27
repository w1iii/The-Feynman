import { NextRequest, NextResponse } from 'next/server'
import { getStripeClient } from '../../../lib/stripe/client'
import { createClient } from '../../../lib/supabase/server'

export async function POST(_request: NextRequest) {
  try {
    const stripe = getStripeClient()
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Read existing stripe_customer_id from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error', profileError)
      // continue — we can create a customer
    }

    let customerId = profile?.stripe_customer_id || null

    // Create Stripe customer if missing
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id }
      })

      customerId = customer.id

      // Persist to profiles table (best-effort)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)

      if (updateError) {
        console.error('Failed to persist stripe_customer_id', updateError)
      }
    }

    const returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/feynman/settings`

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Portal error', err)
    return NextResponse.json({ error: 'Portal creation failed' }, { status: 500 })
  }
}
