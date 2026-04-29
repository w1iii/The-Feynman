import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Get current user from auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Fetch user's profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.log('Profile fetch error:', profileError)
    return NextResponse.json(
      { error: profileError.message },
      { status: 500 }
    )
  }

  return NextResponse.json({
    plan: profile?.plan || 'free',
  })
}