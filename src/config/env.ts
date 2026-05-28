/**
 * @module config/env
 *
 * Validates and parses all server-side environment variables at module load
 * using a Zod schema. This is the single source of truth for runtime
 * configuration consumed by the database client, Redis cache, Better Auth,
 * logging, and Sentry integrations.
 *
 * @remarks
 * Parsing happens eagerly when this module is first imported; invalid or
 * missing required variables cause the process to fail fast with a
 * {@link ZodError}. Optional variables fall back to schema defaults or
 * `undefined`. Values are read from `import.meta.env` (Astro/Vite convention).
 *
 * @see {@link module:types/env.d} for TypeScript augmentations of `ImportMetaEnv`
 * @see {@link module:lib/db/client} for Turso connection usage
 * @see {@link module:lib/cache/client} for Upstash Redis usage
 * @see {@link module:lib/auth/server} for Better Auth secret and base URL
 */
import { z } from 'zod'

/**
 * Zod schema defining required and optional environment variables.
 *
 * @remarks
 * Not exported; use the parsed {@link env} object instead. Kept internal to
 * prevent bypassing validation at import time.
 *
 * @property NODE_ENV - Runtime mode; defaults to `'development'`.
 * @property TURSO_DATABASE_URL - LibSQL/Turso database URL (must be valid URL).
 * @property TURSO_AUTH_TOKEN - Non-empty auth token for Turso remote access.
 * @property SENTRY_DSN - Optional Sentry project DSN; monitoring no-ops when absent.
 * @property APP_BASE_URL - Optional public site URL override for SEO and links.
 * @property BETTER_AUTH_SECRET - Session signing secret; minimum 32 characters.
 * @property BETTER_AUTH_URL - Public origin Better Auth uses for callbacks.
 * @property UPSTASH_REDIS_REST_URL - Upstash Redis REST endpoint URL.
 * @property UPSTASH_REDIS_REST_TOKEN - Non-empty Upstash REST API token.
 * @property LOG_LEVEL - Optional Pino/log level; one of trace through fatal.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  TURSO_DATABASE_URL: z.url(),
  TURSO_AUTH_TOKEN: z.string().min(1),

  SENTRY_DSN: z.string().optional(),

  APP_BASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  UPSTASH_REDIS_REST_URL: z.url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .optional(),
})

/**
 * Parsed and validated environment configuration for the running process.
 *
 * @returns A frozen-in-practice object matching {@link envSchema} output shape.
 * All required keys are present and type-narrowed after successful parse.
 *
 * @throws {import('zod').ZodError} When any required variable is missing,
 * empty where forbidden, fails URL validation, or `BETTER_AUTH_SECRET` is
 * shorter than 32 characters. The error includes per-field issue paths.
 *
 * @example
 * ```typescript
 * import { env } from '@config/env'
 *
 * // Safe to use after import — parse already succeeded
 * const dbUrl = env.TURSO_DATABASE_URL
 * const isProd = env.NODE_ENV === 'production'
 * ```
 *
 * @see {@link module:config} for derived site config built from these values
 */
export const env = envSchema.parse({
  NODE_ENV: import.meta.env.NODE_ENV,
  TURSO_DATABASE_URL: import.meta.env.TURSO_DATABASE_URL,
  TURSO_AUTH_TOKEN: import.meta.env.TURSO_AUTH_TOKEN,
  SENTRY_DSN: import.meta.env.SENTRY_DSN,
  APP_BASE_URL: import.meta.env.APP_BASE_URL,
  BETTER_AUTH_SECRET: import.meta.env.BETTER_AUTH_SECRET,
  LOG_LEVEL: import.meta.env.LOG_LEVEL,

  UPSTASH_REDIS_REST_URL: import.meta.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: import.meta.env.UPSTASH_REDIS_REST_TOKEN,
})
