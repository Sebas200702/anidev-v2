/**
 * Fixed-window rate limiting over Dragonfly/Redis.
 *
 * @module middleware/rate-limit/service
 */
import { redis } from '@lib/cache/client'
import { logger } from '@utils/logger-util'

export const REQUEST_LIMIT_WINDOW_SECONDS = 60
export const GENERAL_RATE_LIMIT = 60
export const AUTH_RATE_LIMIT = 10
export const MEDIA_RATE_LIMIT = 60
export const UPLOAD_RATE_LIMIT = 10

/** Profile image uploads: `PUT /api/user/:userId/avatar|banner`. */
const UPLOAD_PATH = /^\/api\/user\/[^/]+\/(avatar|banner)\/?$/

export const getClientIp = (request: Request): string =>
  (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() ||
  request.headers.get('cf-connecting-ip') ||
  request.headers.get('x-real-ip') ||
  '127.0.0.1'

export interface RateLimitResult {
  allowed: boolean
  retryAfter: number
}

export const enforceRateLimit = async (
  keys: string[],
  limit: number
): Promise<RateLimitResult> => {
  let maxRetryAfter = REQUEST_LIMIT_WINDOW_SECONDS
  for (const key of keys) {
    try {
      const count = await redis.incr(key)
      if (count === 1) {
        await redis.expire(key, REQUEST_LIMIT_WINDOW_SECONDS)
      }
      if (count > limit) {
        const ttl = await redis.ttl(key)
        maxRetryAfter = Math.max(
          maxRetryAfter,
          ttl > 0 ? ttl : REQUEST_LIMIT_WINDOW_SECONDS
        )
      }
    } catch (error) {
      logger.warn({ err: error }, 'Rate limiter degraded (fail-open)')
      return { allowed: true, retryAfter: 0 }
    }
  }
  for (const key of keys) {
    try {
      const count = await redis.get(key)
      if (count !== null && Number(count) > limit) {
        return { allowed: false, retryAfter: maxRetryAfter }
      }
    } catch (error) {
      logger.warn({ err: error }, 'Rate limiter degraded (fail-open)')
      return { allowed: true, retryAfter: 0 }
    }
  }
  return { allowed: true, retryAfter: 0 }
}

/**
 * Picks the rate-limit bucket for a request.
 *
 * @param pathname - Request path
 * @param ip - Client IP
 * @param method - HTTP method; only `PUT` uploads use the upload bucket
 * @returns Keys and limit, or `null` for paths that are not limited
 */
export const resolveRateLimit = (
  pathname: string,
  ip: string,
  method = 'GET'
): { keys: string[]; limit: number } | null => {
  if (!(pathname.startsWith('/api/') || pathname.startsWith('/media/'))) {
    return null
  }
  if (pathname.startsWith('/media/')) {
    return { keys: [`rl:media:${ip}`], limit: MEDIA_RATE_LIMIT }
  }
  if (
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/auth/register')
  ) {
    return { keys: [`rl:auth:ip:${ip}`], limit: AUTH_RATE_LIMIT }
  }
  if (method === 'PUT' && UPLOAD_PATH.test(pathname)) {
    return { keys: [`rl:upload:${ip}`], limit: UPLOAD_RATE_LIMIT }
  }
  return { keys: [`rl:gen:${ip}`], limit: GENERAL_RATE_LIMIT }
}
