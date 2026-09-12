import { NextRequest, NextResponse } from 'next/server'
import { requireEnv } from '../../../lib/env'

const COOKIE_NAME = 'admin_token'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password || password !== requireEnv('ADMIN_PASSWORD')) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const res = NextResponse.json({ success: true })
    res.cookies.set(COOKIE_NAME, '1', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    })
    return res
  } catch {
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 })
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' })
  return res
}
