/**
 * Credential-abuse throttle with failure counting and temporary lockout.
 *
 * @module domains/auth/services/credential-throttle/service
 */
import { redis } from '@lib/cache/client'
import { logger } from '@utils/logger-util'

export const CREDENTIAL_MAX_FAILURES = 5
export const CREDENTIAL_WINDOW_SECONDS = 15 * 60
export const CREDENTIAL_LOCKOUT_SECONDS = 15 * 60

const failKey = (kind: 'ip' | 'email', value: string) =>
  `auth:fail:${kind}:${value}`

const lockKey = (kind: 'ip' | 'email', value: string) =>
  `auth:lock:${kind}:${value}`

export const getClientIpFromHeaders = (headers: Headers): string =>
  (headers.get('x-forwarded-for') ?? '').split(',')[0].trim() ||
  headers.get('cf-connecting-ip') ||
  headers.get('x-real-ip') ||
  '127.0.0.1'

export const checkCredentialLockout = async (
  ip: string,
  email: string
): Promise<{ locked: boolean; retryAfter: number }> => {
  const keys = [lockKey('ip', ip)]
  if (email) keys.push(lockKey('email', email.toLowerCase()))
  try {
    for (const key of keys) {
      const ttl = await redis.ttl(key)
      if (ttl > 0) return { locked: true, retryAfter: ttl }
      const exists = await redis.exists(key)
      if (exists === 1)
        return { locked: true, retryAfter: CREDENTIAL_LOCKOUT_SECONDS }
    }
    return { locked: false, retryAfter: 0 }
  } catch (error) {
    logger.warn({ err: error }, 'Credential throttle degraded (fail-open)')
    return { locked: false, retryAfter: 0 }
  }
}

export const recordCredentialFailure = async (
  ip: string,
  email: string
): Promise<void> => {
  const normalizedEmail = email.toLowerCase()
  const targets: Array<{ kind: 'ip' | 'email'; value: string }> = [
    { kind: 'ip', value: ip },
  ]
  if (normalizedEmail) targets.push({ kind: 'email', value: normalizedEmail })

  for (const { kind, value } of targets) {
    try {
      const count = await redis.incr(failKey(kind, value))
      if (count === 1)
        await redis.expire(failKey(kind, value), CREDENTIAL_WINDOW_SECONDS)
      if (count >= CREDENTIAL_MAX_FAILURES) {
        await redis.set(
          lockKey(kind, value),
          '1',
          'EX',
          CREDENTIAL_LOCKOUT_SECONDS
        )
        logger.warn(
          { kind, value: kind === 'email' ? '[redacted]' : value, count },
          'Auth lockout engaged'
        )
      } else {
        logger.warn({ kind, count }, 'Auth credential failure')
      }
    } catch (error) {
      logger.warn({ err: error }, 'Credential throttle degraded (fail-open)')
    }
  }
}

export const clearCredentialFailures = async (
  ip: string,
  email: string
): Promise<void> => {
  const normalizedEmail = email.toLowerCase()
  try {
    await redis.del(failKey('ip', ip))
    if (normalizedEmail) await redis.del(failKey('email', normalizedEmail))
  } catch (error) {
    logger.warn({ err: error }, 'Credential throttle degraded (fail-open)')
  }
}
