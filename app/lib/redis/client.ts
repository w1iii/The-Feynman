import { Redis } from '@upstash/redis'

let redis: Redis | null = null

export function getRedisClient() {
  if (!redis) {
    const url = process.env.REDIS_URL
    const token = process.env.REDIS_TOKEN

    if (!url || !token) {
      return null
    }

    redis = new Redis({ url, token })
  }

  return redis
}
