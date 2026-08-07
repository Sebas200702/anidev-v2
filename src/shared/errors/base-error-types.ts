/**
 * Severity type for the application error hierarchy.
 *
 * @module shared/errors/base-error-types
 * @remarks
 * Consumed by {@link module:shared/errors/base-error} to classify each error for
 * logging and monitoring.
 *
 * @see {@link BaseError} for the abstract base class that carries this severity
 */

/**
 * Severity level used for logging and monitoring classification.
 *
 * @remarks
 * Assigned per error subclass: `warn` for validation/auth, `error` for domain, `critical` for infra.
 */
export type ErrorSeverity = 'info' | 'warn' | 'error' | 'critical'
