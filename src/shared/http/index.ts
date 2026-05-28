/**
 * Shared HTTP helpers for Astro API route handlers: validation, envelopes, and error wrapping.
 *
 * @module shared/http
 * @remarks
 * Typical route composition:
 * 1. {@link withZodValidation} — parse `params`, `query`, `body`; return 400 on schema failure
 * 2. {@link withErrorHandling} — run business logic; map throws to JSON envelopes
 * 3. {@link createSuccessResponse} / {@link createErrorResponse} / {@link jsonResponse} — low-level envelope builders
 *
 * @see {@link module:shared/http/with-validation}
 * @see {@link module:shared/http/with-error-handling}
 * @see {@link module:shared/http/create-api-response-util}
 */

export * from './create-api-response-util'
export * from './with-error-handling'
export * from './with-validation'
