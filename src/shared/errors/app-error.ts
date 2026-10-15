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
 * - {@link InfraError} → 503 (Sentry reported)
 *
 * @see {@link ErrorCodes} — stable string codes carried on every error
 * @see {@link mapErrorToHttp} — HTTP status and body mapping
 */

export { DomainError } from './domain-error'
export { InfraError } from './infra-error'
export { ValidationError } from './validation-error'
export { ResponseValidationError } from './response-validation-error'
export { RateLimitedError } from './rate-limited-error'
export { AuthError } from './auth-error'
