/**
 * Factory helpers for database-related {@link InfraError} instances.
 *
 * @module shared/errors/db-errors
 * @remarks
 * Use when a repository or query fails due to connectivity, constraint violations surfaced as
 * infrastructure failures, or unexpected driver errors — not for "row not found" cases (those
 * should be {@link DomainError} with a not-found code).
 *
 * **HTTP mapping**: `DB_ERROR` → **500** via {@link mapErrorToHttp}, generic client message,
 * Sentry capture, `severity: critical`.
 *
 * **Details shape** (recommended)
 * ```typescript
 * { operation: string, table?: string, ... }
 * ```
 * The `operation` argument is interpolated into the error message; additional fields belong in `details`.
 *
 * @see {@link InfraError}
 * @see {@link mapErrorToHttp}
 */

import { InfraError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'

/**
 * Creates an infrastructure error for a failed database operation.
 *
 * @param operation - Short name of the failing operation (e.g. `'findAnimeById'`, `'insertSession'`)
 * @param details - Optional structured context (query params, table name) exposed as `meta.details` on 500
 * @param cause - Optional underlying driver error (Drizzle, pg, etc.) stored on `InfraError.cause`
 * @returns An {@link InfraError} with code `DB_ERROR` and message `Database error during ${operation}`
 *
 * @remarks
 * Thrown when the database layer fails unexpectedly. Do not use for business "not found" outcomes.
 *
 * @example
 * ```typescript
 * try {
 *   await db.insert(users).values(row)
 * } catch (cause) {
 *   throw dbError('insertUser', { userId: row.id }, cause)
 * }
 * ```
 *
 * @see {@link mapErrorToHttp}
 */
export function dbError(operation: string, details?: unknown, cause?: unknown) {
  return new InfraError(
    ErrorCodes.DB_ERROR,
    `Database error during ${operation}`,
    details,
    cause
  )
}
