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
 * `undefined`. Values are read from `process.env` so server-side secrets are
 * resolved at runtime (dev via Bun `.env` loading, Docker/CI via injected
 * environment) rather than being inlined at build time.
 *
 * @see {@link module:types/env.d} for TypeScript augmentations of `ImportMetaEnv`
 * @see {@link module:lib/db/client} for PostgreSQL connection usage
 * @see {@link module:lib/cache/client} for Redis/Dragonfly usage
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
 * @property DATABASE_URL - PostgreSQL connection URL (must be valid URL).
 * @property REDIS_URL - Redis/Dragonfly connection URL (must be valid URL).
 * @property SENTRY_DSN - Optional Sentry/Rustrak DSN; monitoring no-ops when absent.
 * @property APP_BASE_URL - Public origin used as Better Auth base URL and SEO canonical.
 * @property BETTER_AUTH_SECRET - Session signing secret; minimum 32 characters.
 * @property LOG_LEVEL - Optional Pino/log level; one of trace through fatal.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  DATABASE_URL: z.url({ protocol: /^(postgres|postgresql)$/ }),
  REDIS_URL: z.url({ protocol: /^(redis|rediss)$/ }),

  SENTRY_DSN: z.string().optional(),

  APP_BASE_URL: z.url(),
  BETTER_AUTH_SECRET: z.string().min(32),
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
 * const dbUrl = env.DATABASE_URL
 * const isProd = env.NODE_ENV === 'production'
 * ```
 *
 * @see {@link module:config} for derived site config built from these values
 */
export const env = envSchema.parse({
  NODE_ENV: import.meta.env.NODE_ENV,
  DATABASE_URL: import.meta.env.DATABASE_URL,
  REDIS_URL: import.meta.env.REDIS_URL,
  SENTRY_DSN: import.meta.env.SENTRY_DSN,
  APP_BASE_URL: import.meta.env.APP_BASE_URL,
  BETTER_AUTH_SECRET: import.meta.env.BETTER_AUTH_SECRET,
  LOG_LEVEL: import.meta.env.LOG_LEVEL,
})
