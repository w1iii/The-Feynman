import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextRequest } from 'next/server'
import { requireEnv } from './env'

export const ADMIN_COOKIE_NAME = 'admin_token'
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8

function sign(payload: string): string {
  return createHmac('sha256', requireEnv('ADMIN_PASSWORD'))
    .update(payload)
    .digest('base64url')
}

export function createAdminToken(): string {
  const payload = `admin:${Date.now()}`
  return `${payload}.${sign(payload)}`
}

export function isAdmin(request: NextRequest): boolean {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value
  if (!token) return false

  const separator = token.lastIndexOf('.')
  if (separator < 0) return false

  const payload = token.slice(0, separator)
  const signature = token.slice(separator + 1)
  if (!payload.startsWith('admin:') || !signature) return false

  const issuedAt = Number(payload.slice('admin:'.length))
  if (!Number.isFinite(issuedAt) || Date.now() - issuedAt < 0 ||
      Date.now() - issuedAt > ADMIN_SESSION_MAX_AGE * 1000) {
    return false
  }

  const expected = sign(payload)
  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  return actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
}
