import { getRedisClient } from './client'

const CACHE_PREFIX = 'feynman:'
const DEFAULT_TTL = 60 * 5 // 5 minutes in seconds
const STATS_TTL = 60 * 10 // 10 minutes
const PROFILE_TTL = 60 * 15 // 15 minutes

export const CacheKeys = {
  profile: (userId: string) => `${CACHE_PREFIX}profile:${userId}`,
  stats: (userId: string) => `${CACHE_PREFIX}stats:${userId}`,
  sessions: (userId: string) => `${CACHE_PREFIX}sessions:${userId}`,
}

export const CacheTTLs = {
  profile: PROFILE_TTL,
  stats: STATS_TTL,
  sessions: DEFAULT_TTL,
}

export async function getCached<T>(key: string): Promise<T | null> {
  const redis = getRedisClient()
  if (!redis) return null

  try {
    const cached = await redis.get<T>(key)
    return cached
  } catch {
    return null
  }
}

export async function setCached(key: string, value: unknown, ttl: number = DEFAULT_TTL): Promise<void> {
  const redis = getRedisClient()
  if (!redis) return

  try {
    await redis.set(key, value, { ex: ttl })
  } catch {
    // Silently fail — caching is optional
  }
}

export async function invalidateCache(...keys: string[]): Promise<void> {
  const redis = getRedisClient()
  if (!redis) return

  try {
    await redis.del(...keys)
  } catch {
    // Silently fail
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
  ]
  await invalidateCache(...keys)
}
