/**
 * Abstract base class and severity type for the application error hierarchy.
 *
 * @module shared/errors/base-error
 * @remarks
 * All first-class application errors extend {@link BaseError}. Concrete subclasses
 * ({@link DomainError}, {@link InfraError}, {@link ValidationError}, {@link AuthError}) live in
 * {@link module:shared/errors/app-error}.
 *
 * @see {@link ErrorCodes} — stable string codes carried on every error
 * @see {@link mapErrorToHttp} — HTTP status and body mapping
 */

import type { ErrorCode } from '@shared/errors/codes'

/**
 * Severity level used for logging and monitoring classification.
 *
 * @remarks
 * Assigned per error subclass: `warn` for validation/auth, `error` for domain, `critical` for infra.
 */
export type ErrorSeverity = 'info' | 'warn' | 'error' | 'critical'

/**
 * Abstract base for all first-class application errors.
 *
 * @remarks
 * Preserves prototype chain for `instanceof` checks after extension. Subclasses set `name` to their
 * class name for clearer stack traces and serialization.
 */
export abstract class BaseError extends Error {
  /** Stable application error code from {@link ErrorCodes}. */
  readonly code: ErrorCode
  /** Logging/monitoring severity for this failure. */
  readonly severity: ErrorSeverity
  /**
   * Optional structured context attached at throw time.
   * @remarks Exposed to clients as `meta.details` when mapped by {@link mapErrorToHttp}.
   */
  readonly details?: unknown
  /** Optional underlying error that triggered this failure (DB driver, fetch, etc.). */
  readonly cause?: unknown

  /**
   * @param name - Error class name exposed on {@link Error.name}
   * @param code - Stable application error code
   * @param message - Human-readable error message
   * @param severity - Logging severity; defaults to `error`
   * @param details - Optional structured context for clients or logs
   * @param cause - Optional underlying error that triggered this failure
   */
  protected constructor(
    name: string,
    code: ErrorCode,
    message: string,
    severity: ErrorSeverity = 'error',
    details?: unknown,
    cause?: unknown
  ) {
    super(message)
    this.name = name
    this.code = code
    this.severity = severity
    this.details = details
    this.cause = cause

    Object.setPrototypeOf(this, new.target.prototype)
  }
}
