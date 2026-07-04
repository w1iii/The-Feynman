import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'

export async function POST(request: NextRequest) {
  const { email, password, redirectTo } = await request.json()

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
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
