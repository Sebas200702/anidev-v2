/**
 * Typed application error hierarchy with stable codes, severity levels, and optional structured details.
 *
 * @module shared/errors/app-error
 * @remarks
 * All domain, infrastructure, validation, and auth failures should extend {@link BaseError} (or a
 * subclass) so {@link mapErrorToHttp} can map them to consistent HTTP responses and logging behavior.
 *
 * **HTTP mapping** (via {@link mapErrorToHttp})
 * - {@link ValidationError} → 400
 * - {@link AuthError} → 401 / 403 (by code)
 * - {@link DomainError} → 404 / 400 (by code)
 * - {@link InfraError} → 500 (Sentry reported)
 *
 * **Details shape**
 * `details` is intentionally `unknown` — factories may attach Zod `issues`, entity ids, operation names,
 * or nested causes. Clients receive it under `meta.details` in HTTP error bodies when mapped.
 *
 * @see {@link ErrorCodes} — stable string codes carried on every error
 * @see {@link mapErrorToHttp} — HTTP status and body mapping
 */

import type { ErrorCode } from '@shared/errors/codes'
import { BaseError } from '@shared/errors/base-error'

// BaseError and ErrorSeverity are re-exported via the barrel at `@shared/errors`.
// Import them from there or from `@shared/errors/base-error` directly.

/**
 * Business-rule violation raised by domain logic (not found, invalid id, unsupported path, etc.).
 *
 * @remarks
 * Mapped to **404** when `code` is a known not-found code; otherwise **400**. Logged at `warn` or `error`
 * depending on status. Not reported to Sentry.
 *
 * @see {@link mapErrorToHttp}
 */
export class DomainError extends BaseError {
  /**
   * @param code - Domain-specific error code (e.g. `ANIME_NOT_FOUND`)
   * @param message - Human-readable error message
   * @param details - Optional structured context (entity id, raw path, etc.)
   * @param cause - Optional underlying error
   */
  constructor(
    code: ErrorCode,
    message: string,
    details?: unknown,
    cause?: unknown
  ) {
    super('DomainError', code, message, 'error', details, cause)
  }
}

/**
 * Infrastructure failure: database, cache, external APIs, or other operational errors.
 *
 * @remarks
 * Always mapped to **500** with a generic client message. Logged at `error` and sent to Sentry.
 * Severity is `critical` on the error instance.
 *
 * @see {@link dbError} — factory for `DB_ERROR`
 */
export class InfraError extends BaseError {
  /**
   * @param code - Infrastructure error code (e.g. `DB_ERROR`, `CACHE_ERROR`)
   * @param message - Human-readable error message (may be hidden from clients on 500)
   * @param details - Optional structured context (operation name, query hints)
   * @param cause - Optional underlying driver or network error
   */
  constructor(
    code: ErrorCode,
    message: string,
    details?: unknown,
    cause?: unknown
  ) {
    super('InfraError', code, message, 'critical', details, cause)
  }
}

/**
 * Request validation failure from Zod or manual input checks.
 *
 * @remarks
 * Mapped to **400**. Typical `details` shape: `{ issues: ZodIssue[] }` from {@link withZodValidation}.
 * Logged at `warn`. Not reported to Sentry.
 */
export class ValidationError extends BaseError {
  /**
   * @param code - Validation error code (typically `VALIDATION_ERROR`)
   * @param message - Human-readable error message
   * @param details - Optional structured validation context (e.g. Zod issues)
   * @param cause - Optional underlying parse error
   */
  constructor(
    code: ErrorCode,
    message: string,
    details?: unknown,
    cause?: unknown
  ) {
    super('ValidationError', code, message, 'warn', details, cause)
  }
}

/**
 * Authentication or authorization failure.
 *
 * @remarks
 * Mapped to **401** for missing/invalid/expired credentials, **403** for `AUTH_FORBIDDEN`.
 * Logged at `warn`. Not reported to Sentry.
 *
 * @see {@link authRequired} and related factories in `auth-errors.ts`
 */
export class AuthError extends BaseError {
  /**
   * @param code - Auth error code (`AUTH_REQUIRED`, `AUTH_FORBIDDEN`, etc.)
   * @param message - Human-readable error message
   * @param details - Optional structured context (session id hints, resource name)
   * @param cause - Optional underlying auth provider error
   */
  constructor(
    code: ErrorCode,
    message: string,
    details?: unknown,
    cause?: unknown
  ) {
    super('AuthError', code, message, 'warn', details, cause)
  }
}
