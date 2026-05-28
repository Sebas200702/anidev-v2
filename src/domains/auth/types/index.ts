/**
 * Authentication input type exports.
 *
 * @module domains/auth/types
 * @remarks
 * Re-exports inferred Zod types for authentication request bodies. Provides a stable
 * import path for services, API routes, and tests without importing schema definitions
 * directly.
 *
 * @see {@link LoginInput} — validated login credentials shape
 * @see {@link RegisterInput} — validated registration fields shape
 * @see {@link loginSchema} — source schema for {@link LoginInput}
 * @see {@link registerSchema} — source schema for {@link RegisterInput}
 *
 * @example
 * ```typescript
 * import type { LoginInput, RegisterInput } from '@domains/auth/types'
 *
 * function handleLogin(input: LoginInput) {
 *   return credentialsService.login(input, headers)
 * }
 * ```
 */

/**
 * Validated email/password login request body.
 *
 * @remarks
 * Inferred from {@link loginSchema} as `{ email: string; password: string }`.
 * Consumed by {@link credentialsService.login} and Better Auth `signInEmail`.
 *
 * @see {@link loginSchema}
 * @see {@link credentialsService.login}
 *
 * @example
 * ```typescript
 * const input: LoginInput = { email: 'user@example.com', password: 'password123' }
 * ```
 */
export type { LoginInput } from '@domains/auth/schemas'

/**
 * Validated email/password registration request body.
 *
 * @remarks
 * Inferred from {@link registerSchema} as `{ email: string; password: string; name: string }`.
 * Consumed by {@link credentialsService.register} and Better Auth `signUpEmail`.
 *
 * @see {@link registerSchema}
 * @see {@link credentialsService.register}
 *
 * @example
 * ```typescript
 * const input: RegisterInput = {
 *   email: 'new@example.com',
 *   password: 'password123',
 *   name: 'Alice',
 * }
 * ```
 */
export type { RegisterInput } from '@domains/auth/schemas'
