/**
 * Public readiness check endpoint.
 *
 * @module pages/api/health/readiness
 *
 * **Route:** `GET /api/health/readiness` (public via the `/api/health` prefix)
 *
 * Probes the two dependencies the app needs to serve traffic — the database (a
 * trivial `SELECT 1`) and the cache (a SET+GET round trip) — and reports their
 * status per-component. The aggregate is `200 OK` only when every dependency is
 * healthy; otherwise `503 Service Unavailable`. Probes never throw: a failing
 * dependency is reported as `'down'` and logged, so the endpoint always resolves.
 *
 * **Success response — `200 OK`**
 * ```typescript
 * { data: { db: 'ok', cache: 'ok' }, status: 200, meta: {} }
 * ```
 *
 * **Degraded response — `503 Service Unavailable`**
 * ```typescript
 * { data: { db: 'down', cache: 'ok' }, status: 503, meta: {} }
 * ```
 *
 * @see {@link probeDatabase} / {@link probeCache}
 * @see {@link withErrorHandling}
 * @see {@link module:pages/api/health} — liveness `/api/health` (dependency-free)
 */
import { sql } from 'drizzle-orm'
import { db } from '@db/client'
import { cacheDel, cacheGet, cacheSet } from '@lib/cache/cache-primitives'
import { CacheTtl } from '@lib/cache/config'
import { logger } from '@utils/logger-util'
import { withErrorHandling } from '@http/with-error-handling'

const READINESS_PROBE_PAYLOAD = 'pong'

/**
 * Checks database availability with a trivial `SELECT 1`.
 *
 * @returns `true` when the probe succeeds, `false` when it fails (never throws)
 *
 * @example
 * ```typescript
 * const up = await probeDatabase()
 * ```
 */
export const probeDatabase = async (): Promise<boolean> => {
  try {
    await db.execute(sql`select 1`)
    return true
  } catch (error) {
    logger.warn({ err: error }, 'Readiness: database probe failed')
    return false
  }
}

/**
 * Checks cache availability with a short-lived SET+GET round trip.
 *
 * @returns `true` when the value round-trips, `false` when it misses (never throws)
 *
 * @remarks
 * `cacheSet` no-ops when the backend is unreachable, so a subsequent miss is
 * treated as `'down'`. The probe key is deleted best-effort afterwards.
 */
export const probeCache = async (): Promise<boolean> => {
  const key = `health:readiness:${Date.now()}`
  try {
    await cacheSet(key, READINESS_PROBE_PAYLOAD, {
      ttlSeconds: CacheTtl.VeryShort,
    })
    const value = await cacheGet<string>(key)
    return value === READINESS_PROBE_PAYLOAD
  } catch (error) {
    logger.warn({ err: error }, 'Readiness: cache probe failed')
    return false
  } finally {
    await cacheDel(key)
  }
}

/**
 * Aggregates the dependency probes into the readiness envelope.
 *
 * @returns Data with per-dependency status via {@link withErrorHandling}
 */
export const readiness = async () => {
  const [databaseUp, cacheUp] = await Promise.all([
    probeDatabase(),
    probeCache(),
  ])

  return {
    data: { db: databaseUp ? 'ok' : 'down', cache: cacheUp ? 'ok' : 'down' },
    status: databaseUp && cacheUp ? 200 : 503,
  }
}

export const GET = withErrorHandling(readiness)
