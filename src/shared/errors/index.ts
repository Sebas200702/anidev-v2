/**
 * Shared error types, stable codes, factory helpers, and HTTP mapping utilities.
 *
 * @module shared/errors
 * @remarks
 * Central export for the application error model. Domain code should throw {@link DomainError},
 * {@link ValidationError}, {@link AuthError}, or {@link InfraError} (or use factories) so API routes
 * can rely on {@link mapErrorToHttp} for consistent status codes and JSON bodies.
 *
 * @see {@link module:shared/errors/app-error} — class hierarchy
 * @see {@link module:shared/errors/codes} — `ErrorCodes` constants
 * @see {@link module:shared/errors/map-error-to-http} — HTTP status mapping and Sentry rules
 */

export * from './base-error'
export * from './app-error'
export * from './auth-errors'
export * from './codes'
export * from './db-errors'
export * from './http-error-types'
export * from './error-http-maps'
export * from './map-error-to-http'
