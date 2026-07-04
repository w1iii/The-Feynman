import { Redis } from '@upstash/redis'

let redis: Redis | null = null

export function getRedisClient() {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!url || !token) {
      return null
    }

    redis = new Redis({
      url,
      token,
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 2000)
        return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timeout))
      },
    } as any)
  }

  return redis
}
