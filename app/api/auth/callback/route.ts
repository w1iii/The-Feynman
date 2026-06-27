import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { requireEnv } from '../../../lib/env'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  const supabaseResponse = NextResponse.redirect(`${origin}${next}`)

  if (code) {
    const supabase = createServerClient(
      requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
      requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              supabaseResponse.cookies.set(name, value, options)
            })
          },
        },
      }
    )
    await supabase.auth.exchangeCodeForSession(code)
  }

  return supabaseResponse
}