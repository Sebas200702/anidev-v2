/**
 * Public health check endpoint.
 *
 * @module pages/api/health
 *
 * **Route:** `GET /api/health`
 *
 * **Authentication:** Public — no session required ({@link isPublicRoute} allowlists `/api/health`).
 *
 * Returns a liveness envelope and emits an `info`-level structured log on every
 * request. The log flows through the Pino → Sentry/Rustrak bridge
 * ({@link module:lib/monitoring/sentry}) when a monitoring DSN is configured,
 * which makes this endpoint a deterministic end-to-end smoke test for the log
 * pipeline. It also sends an explicit `captureMessage` event so connectivity can
 * be verified independently of the Pino bridge.
 *
 * @see {@link logger} — app logger that forwards to the monitoring bridge
 * @see {@link module:lib/monitoring/sentry} — pinoIntegration bridge to Rustrak
 * @see {@link withErrorHandling} — standardized JSON envelope wrapper
 */

import * as Sentry from '@sentry/astro'
import { logger } from '@utils/logger-util'
import { withErrorHandling } from '@http/with-error-handling'

/**
 * Returns `200 OK` with `{ status: 'ok' }` and logs the check at `info` level.
 *
 * @remarks
 * **Success response — `200 OK`**
 *
 * ```typescript
 * {
 *   data: { status: 'ok' }
 *   status: 200
 *   meta: {}
 * }
 * ```
 *
 * @example
 * ```bash
 * curl http://localhost:4321/api/health
 * # {"data":{"status":"ok"},"status":200,"meta":{}}
 * ```
 */
export const GET = withErrorHandling(async () => {
  logger.info({ route: '/api/health' }, 'Health check requested')
  Sentry.captureMessage('Health check')

  return { data: { status: 'ok' }, status: 200 }
})
