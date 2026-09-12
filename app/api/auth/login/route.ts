import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { rateLimit, getClientIp } from '../../../lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { allowed, remaining } = await rateLimit(`login:${ip}`, 10, 60)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429 }
    )
  }

  const { email, password } = await request.json()

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    )
  }

  return NextResponse.json({
    user: data.user,
    session: data.session,
  })
}
