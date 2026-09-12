import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '../../../lib/supabase/auth-helper'

export async function POST(request: NextRequest) {
  try {
    const { user, supabase, error } = await requireUser()
    if (error) return error

    const body = await request.json()
    const amount = body.amount || parseInt(process.env.PAYMONGO_AMOUNT_PRO || '49900', 10)

    if (!amount || amount < 100) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const secretKey = process.env.PAYMONGO_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json({ error: 'PayMongo not configured' }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    // Create PayMongo checkout session
    const res = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            send_email_receipt: true,
            show_line_items: true,
            line_items: [
              {
                name: 'Feynman Pro',
                amount: amount,
                currency: 'PHP',
                quantity: 1,
              },
            ],
            payment_method_types: ['card', 'gcash', 'paymaya'],
            success_url: `${baseUrl}/feynman/settings?session=success`,
            cancel_url: `${baseUrl}/feynman/settings?session=cancel`,
            description: 'Feynman Pro Subscription',
            metadata: {
              user_id: user.id,
            },
          },
        },
      }),
    })

    const data = await res.json()

    if (!res.ok || !data.data?.attributes?.checkout_url) {
      console.error('PayMongo checkout error', data)
      return NextResponse.json({ error: 'Checkout creation failed' }, { status: 500 })
    }

    // Store paymongo customer reference if needed
    const checkoutSessionId = data.data.id
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ paymongo_customer_id: checkoutSessionId })
      .eq('user_id', user.id)

    if (updateError) console.error('Failed to persist paymongo_customer_id', updateError)

    return NextResponse.json({ url: data.data.attributes.checkout_url })
  } catch (err) {
    console.error('Checkout error', err)
    return NextResponse.json({ error: 'Checkout creation failed' }, { status: 500 })
  }
}
