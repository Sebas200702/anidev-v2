import { redis } from '@/core/cache/client'

type CacheGetSetOptions = {
  ttlSeconds?: number
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const raw = await redis.get<T>(key)
  if (!raw) return null

  try {
    const parsed = raw

    return parsed
  } catch {
    return null
  }
}

export async function cacheSet<T>(
  key: string,
  value: T,
  { ttlSeconds }: CacheGetSetOptions = {}
): Promise<void> {
  const payload = JSON.stringify(value)

  if (ttlSeconds && ttlSeconds > 0) {
    await redis.set(key, payload, { ex: ttlSeconds })
  } else {
    await redis.set(key, payload)
  }
}

export async function cacheDel(key: string): Promise<void> {
  await redis.del(key)
}

export const withCache = async <T>({
  key,
  getCache,
  setCache,
  compute,
  shouldCache = () => true,
}: {
  key: string
  getCache: (key: string) => Promise<T | null>
  setCache: (key: string, value: T) => Promise<void>
  compute: () => Promise<T>
  shouldCache?: (result: T) => boolean
}): Promise<T> => {
  const cached = await getCache(key)
  if (cached !== null) return cached

  const result = await compute()

  if (shouldCache(result)) {
    await setCache(key, result)
  }

  return result
}
