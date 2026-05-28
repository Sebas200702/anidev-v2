/**
 * Zod schemas for authentication API payloads.
 *
 * @module domains/auth/schemas/login-schema
 * @remarks
 * Validates request bodies for Better Auth email/password flows before they reach
 * {@link credentialsService}. Password minimum length aligns with common credential
 * security baselines; email fields use Zod's built-in RFC-style email validation.
 *
 * @see {@link credentialsService.login} — consumes {@link LoginInput}
 * @see {@link credentialsService.register} — consumes {@link RegisterInput}
 * @see {@link sessionResponseSchema} — validates session lookup responses
 * @see {@link withZodValidation} — HTTP wrapper that applies these schemas
 */
import { z } from 'zod'

/**
 * Validates email/password login request bodies.
 *
 * @remarks
 * **Fields** (`body`):
 * - `email` — `string`, must be a valid email address (`z.string().email()`)
 * - `password` — `string`, minimum 8 characters (`z.string().min(8)`)
 *
 * Wraps fields in a top-level `body` key to match API route validation conventions.
 *
 * @see {@link LoginInput} — inferred TypeScript type for `body`
 * @see {@link credentialsService.login} — Better Auth `signInEmail` consumer
 *
 * @example
 * ```typescript
 * const { body } = loginSchema.parse({
 *   body: { email: 'user@example.com', password: 'secret123' },
 * })
 * await credentialsService.login(body, request.headers)
 * ```
 */
export const loginSchema = z.object({
  body: z.object({
    /** User email address; validated as RFC-style email string. */
    email: z.string().email(),
    /** Plain-text password; minimum 8 characters. */
    password: z.string().min(8),
  }),
})

/**
 * Validates email/password registration request bodies.
 *
 * @remarks
 * **Fields** (`body`):
 * - `email` — `string`, must be a valid email address (`z.string().email()`)
 * - `password` — `string`, minimum 8 characters (`z.string().min(8)`)
 * - `name` — `string`, minimum 1 non-empty character (`z.string().min(1)`)
 *
 * Wraps fields in a top-level `body` key to match API route validation conventions.
 *
 * @see {@link RegisterInput} — inferred TypeScript type for `body`
 * @see {@link credentialsService.register} — Better Auth `signUpEmail` consumer
 *
 * @example
 * ```typescript
 * const { body } = registerSchema.parse({
 *   body: { email: 'new@example.com', password: 'secret123', name: 'Alice' },
 * })
 * await credentialsService.register(body, request.headers)
 * ```
 */
export const registerSchema = z.object({
  body: z.object({
    /** Account email address; validated as RFC-style email string. */
    email: z.string().email(),
    /** Account password; minimum 8 characters. */
    password: z.string().min(8),
    /** Display name; required, at least one character. */
    name: z.string().min(1),
  }),
})

/**
 * Validates session lookup responses from Better Auth `getSession`.
 *
 * @remarks
 * **Fields**:
 * - `user` — nullable object:
 *   - `id` — `string`, user identifier
 *   - `email` — `string`, user email
 *   - `name` — `string`, display name
 * - `session` — nullable object:
 *   - `id` — `string`, session identifier
 *   - `userId` — `string`, owning user id
 *   - `expiresAt` — `Date`, coerced from ISO string via `z.coerce.date()`
 *
 * Both `user` and `session` are `null` when the request is unauthenticated.
 *
 * @see {@link sessionService.getSession} — produces data matching this shape
 * @see {@link resolveAuthActor} — extracts `user` and `session` for Astro locals
 *
 * @example
 * ```typescript
 * const sessionData = await sessionService.getSession(request.headers)
 * const validated = sessionResponseSchema.parse(sessionData)
 * ```
 */
export const sessionResponseSchema = z.object({
  user: z
    .object({
      /** Better Auth user identifier. */
      id: z.string(),
      /** User email address. */
      email: z.string(),
      /** User display name. */
      name: z.string(),
    })
    .nullable(),
  session: z
    .object({
      /** Better Auth session identifier. */
      id: z.string(),
      /** ID of the user this session belongs to. */
      userId: z.string(),
      /** Session expiration timestamp (coerced to Date). */
      expiresAt: z.coerce.date(),
    })
    .nullable(),
})

/**
 * Parsed login request body after {@link loginSchema} validation.
 *
 * @remarks
 * Inferred as `{ email: string; password: string }`. Passed directly to
 * Better Auth `signInEmail` via {@link credentialsService.login}.
 *
 * @see {@link loginSchema} — source schema
 * @see {@link credentialsService.login} — consumer
 *
 * @example
 * ```typescript
 * const input: LoginInput = { email: 'user@example.com', password: 'password123' }
 * ```
 */
export type LoginInput = z.infer<typeof loginSchema>['body']

/**
 * Parsed registration request body after {@link registerSchema} validation.
 *
 * @remarks
 * Inferred as `{ email: string; password: string; name: string }`. Passed directly to
 * Better Auth `signUpEmail` via {@link credentialsService.register}.
 *
 * @see {@link registerSchema} — source schema
 * @see {@link credentialsService.register} — consumer
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
export type RegisterInput = z.infer<typeof registerSchema>['body']
