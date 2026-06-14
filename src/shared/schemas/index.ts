/**
 * Shared Zod schemas for API contracts and response validation.
 *
 * @module shared/schemas
 * @remarks
 * Schemas mirror the runtime envelope produced by {@link createSuccessResponse} and
 * {@link createErrorResponse} so client SDKs and tests can validate responses structurally.
 *
 * @see {@link module:shared/schemas/api-schema} — {@link createApiResponseSchema}
 */

export { createApiResponseSchema, type ApiResponse } from './api-schema'
