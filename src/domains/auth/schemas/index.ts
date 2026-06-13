/**
 * Authentication schema exports.
 *
 * @module domains/auth/schemas
 * @remarks
 * Zod schemas for validating authentication API request bodies and session response
 * shapes. Used by HTTP route wrappers ({@link withZodValidation}) before delegating to
 * {@link credentialsService} or {@link sessionService}.
 *
 * @see {@link loginSchema} — email/password login validation
 * @see {@link registerSchema} — email/password registration validation
 * @see {@link sessionResponseSchema} — Better Auth session response shape
 * @see {@link LoginInput} — inferred login body type
 * @see {@link RegisterInput} — inferred registration body type
 *
 * @example
 * ```typescript
 * import { loginSchema, type LoginInput } from '@domains/auth/schemas'
 *
 * const parsed = loginSchema.parse({ body: { email: 'a@b.com', password: '12345678' } })
 * const input: LoginInput = parsed.body
 * ```
 */

/** Zod schemas and inferred types for login and registration payloads. */
export * from './login-schema'
/** Zod schema for Better Auth session lookup responses. */
export * from './session-schema'
