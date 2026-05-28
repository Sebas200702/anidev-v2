/**
 * @module middleware
 *
 * Barrel re-export for Astro middleware entry points. Astro resolves
 * `src/middleware/index.ts` (or `middleware.ts`) automatically on each
 * request before route handlers and API endpoints execute.
 *
 * @remarks
 * Import from this barrel in documentation and cross-module references.
 * Astro itself loads middleware by file convention, not via this export.
 * Prefer importing {@link onRequest} directly from `./auth-middleware` when
 * writing tests that need the concrete implementation without barrel indirection.
 *
 * @see {@link module:middleware/auth-middleware} for session resolution logic
 * @see {@link module:config/public-routes} for public route allowlist used by auth middleware
 */
export { onRequest, requestSessionMiddleware } from './auth-middleware'
