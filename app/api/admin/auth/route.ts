import { NextRequest, NextResponse } from 'next/server'
import { requireEnv } from '../../../lib/env'
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE,
  createAdminToken,
} from '../../../lib/admin-auth'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (!password || password !== requireEnv('ADMIN_PASSWORD')) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }

    const res = NextResponse.json({ success: true })
    res.cookies.set(ADMIN_COOKIE_NAME, createAdminToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ADMIN_SESSION_MAX_AGE,
    })
    return res
  } catch {
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 })
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.set(ADMIN_COOKIE_NAME, '', { maxAge: 0, path: '/' })
  return res
}
