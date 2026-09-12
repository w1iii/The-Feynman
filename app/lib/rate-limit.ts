import { getRedisClient } from './redis/client'

type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetMs: number
}

const memStore = new Map<string, { count: number; windowStart: number }>()

// Evict stale entries when store gets too large
function evictStale(maxWindowMs: number) {
  if (memStore.size > 10_000) {
    const now = Date.now();
    for (const [k, v] of memStore) {
      if (now - v.windowStart > maxWindowMs * 2) memStore.delete(k);
    }
  }
}

export async function rateLimit(
  key: string,
  maxRequests: number,
  windowSec: number
): Promise<RateLimitResult> {
  const now = Date.now()
  const windowMs = windowSec * 1000
  const windowStart = now - (now % windowMs)
  const fullKey = `rl:${key}:${windowStart}`
  const redis = getRedisClient()

  if (!redis) {
    evictStale(windowMs);
    const entry = memStore.get(fullKey)
    if (!entry || now - entry.windowStart >= windowMs) {
      memStore.set(fullKey, { count: 1, windowStart })
      return { allowed: true, remaining: maxRequests - 1, resetMs: windowStart + windowMs }
    }
    entry.count++
    const allowed = entry.count <= maxRequests
    return { allowed, remaining: Math.max(0, maxRequests - entry.count), resetMs: windowStart + windowMs }
  }

  try {
    const count = await redis.incr(fullKey)
    if (count === 1) {
      await redis.expire(fullKey, windowSec)
    }
    const allowed = count <= maxRequests
    const ttl = await redis.ttl(fullKey)
    const resetMs = now + (ttl > 0 ? ttl * 1000 : windowMs)
    return { allowed, remaining: Math.max(0, maxRequests - count), resetMs }
  } catch {
    return { allowed: true, remaining: maxRequests, resetMs: windowStart + windowMs }
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const real = request.headers.get('x-real-ip')
  if (real) return real
  return 'unknown'
}
