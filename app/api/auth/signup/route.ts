import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { rateLimit, getClientIp } from '../../../lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { allowed } = await rateLimit(`signup:${ip}`, 5, 300)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many signup attempts. Please try again later.' },
      { status: 429 }
    )
  }

  const { username, email, password, redirectTo } = await request.json()

  if (!email || !password || !username) {
    return NextResponse.json(
      { error: 'Email, password, and username are required' },
      { status: 400 }
    )
  }

  if (username.length < 3) {
    return NextResponse.json(
      { error: 'Username must be at least 3 characters' },
      { status: 400 }
    )
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: 'Email is not valid' },
      { status: 400 }
    )
  }

  if (password.length < 6) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo,
    },
  })

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }

  // Create user profile with default free plan
  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: data.user.id,
        email: data.user.email,
        username,
        plan: 'free',
      })

    if (profileError) {
      // Log error but don't fail signup - profile can be created later
      console.error('Failed to create profile:', profileError)
    }
  }

  const autoConfirmed = !!data.session

  return NextResponse.json({
    user: data.user,
    session: data.session,
    autoConfirmed,
    message: autoConfirmed
      ? 'Account created successfully'
      : 'Check your email for confirmation link',
  })
}
