/**
 * Reports a thrown value to the active monitoring backend (Rustrak/Sentry).
 *
 * @module shared/errors/capture-error
 * @remarks
 * Thin wrapper over `@sentry/node`'s `captureException` used as the single
 * capture entry point from {@link module:shared/errors/map-error-to-http}.
 * Keeps the level decision (client-caused 4xx vs server 5xx) in one place.
 * No-ops when the SDK has no DSN configured.
 *
 * @internal - consumed by `map-error-to-http`; not part of the `@shared/errors` barrel.
 */

import * as SentryNode from '@sentry/node'
import type { SeverityLevel } from '@sentry/node'

/** Default severity for captured errors when the caller does not pick one. */
export const ERROR_CAPTURE_LEVEL: SeverityLevel = 'error'

/**
 * Sends `error` to the monitoring backend at the given severity.
 *
 * @param error - Any thrown value (will be normalized by the SDK)
 * @param level - Severity for filtering/alerting; defaults to `error`
 * @returns `void`; never throws — the SDK buffers when the backend is unreachable
 *
 * @remarks
 * Client-caused failures (HTTP 4xx) should be reported with `level: 'warning'`;
 * server failures (HTTP 5xx) keep the `error` default.
 *
 * @example
 * ```typescript
 * import { captureError } from '@shared/errors/capture-error'
 *
 * captureError(validationFailure, 'warning')
 * ```
 *
 * @see {@link module:shared/errors/map-error-to-http} — sole caller
 */
export const captureError = (
  error: unknown,
  level: SeverityLevel = ERROR_CAPTURE_LEVEL
) => {
  SentryNode.captureException(error, { level })
}
