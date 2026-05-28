/**
 * Public entry point for cross-cutting shared code: UI building blocks, errors, HTTP helpers, schemas, and utilities.
 *
 * @module shared
 * @remarks
 * Re-exports the full surface of `shared/*` subpackages so consumers can import from `@shared` (or the
 * configured path alias) without reaching into internal folder structure.
 *
 * **Subpackages**
 * - `components` — reusable Astro components (e.g. responsive picture)
 * - `errors` — {@link BaseError} hierarchy, {@link ErrorCodes}, factories, {@link mapErrorToHttp}
 * - `http` — {@link withErrorHandling}, {@link withZodValidation}, response envelope helpers
 * - `layouts` — shared Astro page layouts
 * - `schemas` — Zod API contract schemas
 * - `utils` — logging, string normalization, image/media helpers
 *
 * @see {@link module:shared/errors}
 * @see {@link module:shared/http}
 * @see {@link module:shared/schemas}
 * @see {@link module:shared/utils}
 */

export * from './components'
export * from './errors'
export * from './http'
export * from './layouts'
export * from './schemas'
export * from './utils'
