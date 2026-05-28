/**
 * Public entry point for the authentication domain module.
 *
 * @module domains/auth
 * @remarks
 * Re-exports the auth domain surface: typed errors, middleware helpers, Zod schemas,
 * Better Auth service wrappers, input types, and error-mapping utilities. Consumers should
 * import from this barrel rather than deep paths to keep session flow and credential handling
 * consistent across API routes and Astro middleware.
 *
 * **Better Auth integration**
 * - {@link credentialsService} — email/password sign-in and sign-up via `signInEmail` / `signUpEmail`
 * - {@link sessionService} — session lookup and sign-out via `getSession` / `signOut`
 * - {@link resolveAuthActor} — populates `App.Locals` user/session from request headers
 * - {@link mapBetterAuthError} — normalizes Better Auth failures into domain {@link AuthError} subclasses
 *
 * @see {@link credentialsService} — credential-based authentication
 * @see {@link sessionService} — session lifecycle operations
 * @see {@link resolveAuthActor} — Astro middleware actor resolution
 * @see {@link mapBetterAuthError} — Better Auth error normalization
 *
 * @example
 * ```typescript
 * import {
 *   credentialsService,
 *   sessionService,
 *   loginSchema,
 *   InvalidCredentialsError,
 * } from '@domains/auth'
 *
 * const session = await sessionService.getSession(request.headers)
 * ```
 */

/** Authentication domain error classes and factories. */
export * from './errors'
/** Middleware helpers for resolving authenticated actors. */
export * from './middleware'
/** Zod schemas and inferred input types for auth API payloads. */
export * from './schemas'
/** Better Auth service wrappers for credentials and sessions. */
export * from './services'
/** Re-exported authentication input types. */
export * from './types'
/** Utilities for mapping Better Auth errors to domain errors. */
export * from './utils'
