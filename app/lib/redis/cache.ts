import { getRedisClient } from './client'

const CACHE_PREFIX = 'feynman:'
const DEFAULT_TTL = 60 * 5 // 5 minutes in seconds
const STATS_TTL = 60 * 10 // 10 minutes
const PROFILE_TTL = 60 * 15 // 15 minutes

export const CacheKeys = {
  profile: (userId: string) => `${CACHE_PREFIX}profile:${userId}`,
  stats: (userId: string) => `${CACHE_PREFIX}stats:${userId}`,
  sessions: (userId: string) => `${CACHE_PREFIX}sessions:${userId}`,
  sessionDetail: (sessionId: string) => `${CACHE_PREFIX}session:${sessionId}`,
  billing: (userId: string) => `${CACHE_PREFIX}billing:${userId}`,
}

export const CacheTTLs = {
  profile: PROFILE_TTL,
  stats: STATS_TTL,
  sessions: DEFAULT_TTL,
  sessionDetail: DEFAULT_TTL,
  billing: DEFAULT_TTL,
}

// In-memory fallback when Redis is unreachable
const memCache = new Map<string, { value: unknown; expires: number }>()

function getMemCache<T>(key: string): T | null {
  const entry = memCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expires) {
    memCache.delete(key)
    return null
  }
  return entry.value as T
}

function setMemCache(key: string, value: unknown, ttl: number): void {
  memCache.set(key, { value, expires: Date.now() + ttl * 1000 })
  // Evict old entries if map grows too large
  if (memCache.size > 500) {
    const now = Date.now()
    for (const [k, v] of memCache) {
      if (now > v.expires) memCache.delete(k)
    }
  }
}

function delMemCache(...keys: string[]): void {
  for (const key of keys) memCache.delete(key)
}

let redisUnreachable: boolean | null = null

async function checkRedis(): Promise<boolean> {
  const redis = getRedisClient()
  if (!redis) return false
  try {
    const start = Date.now()
    await redis.ping()
    if (Date.now() - start > 100) {
      console.warn(`Redis ping slow (${Date.now() - start}ms), keeping memory fallback ready`)
    }
    return true
  } catch (err) {
    console.warn('Redis unreachable on startup check, using memory cache:', err)
    return false
  }
}

export async function getCached<T>(key: string): Promise<T | null> {
  if (redisUnreachable === null) redisUnreachable = !(await checkRedis())
  if (redisUnreachable) return getMemCache<T>(key)

  const redis = getRedisClient()
  if (!redis) return null

  try {
    return await redis.get<T>(key)
  } catch (err) {
    redisUnreachable = true
    console.warn('Redis unreachable, falling back to memory cache:', err)
    return getMemCache<T>(key)
  }
}

export async function setCached(key: string, value: unknown, ttl: number = DEFAULT_TTL): Promise<void> {
  if (redisUnreachable === null) redisUnreachable = !(await checkRedis())
  if (redisUnreachable) {
    setMemCache(key, value, ttl)
    return
  }

  const redis = getRedisClient()
  if (!redis) return

  try {
    await redis.set(key, value, { ex: ttl })
  } catch (err) {
    redisUnreachable = true
    console.warn('Redis unreachable, falling back to memory cache:', err)
    setMemCache(key, value, ttl)
  }
}

export async function invalidateCache(...keys: string[]): Promise<void> {
  delMemCache(...keys)

  if (redisUnreachable === null) redisUnreachable = !(await checkRedis())
  if (redisUnreachable) return

  const redis = getRedisClient()
  if (!redis) return

  try {
    await redis.del(...keys)
  } catch (err) {
    redisUnreachable = true
    console.warn('Redis del error:', err)
  }
}

export async function invalidateUserCache(userId: string): Promise<void> {
  const keys = [
    CacheKeys.profile(userId),
    CacheKeys.stats(userId),
    CacheKeys.sessions(userId),
  ]
  await invalidateCache(...keys)
}

export async function invalidateUserSessionsAndStats(userId: string): Promise<void> {
  const keys = [
    CacheKeys.stats(userId),
    CacheKeys.sessions(userId),
    CacheKeys.billing(userId),
  ]
  await invalidateCache(...keys)
}

export async function invalidateSessionCache(sessionId: string): Promise<void> {
  await invalidateCache(CacheKeys.sessionDetail(sessionId))
}
