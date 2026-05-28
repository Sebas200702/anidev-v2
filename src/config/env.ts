import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  TURSO_DATABASE_URL: z.url(),
  TURSO_AUTH_TOKEN: z.string().min(1),

  SENTRY_DSN: z.string().optional(),

  APP_BASE_URL: z.url().optional(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  UPSTASH_REDIS_REST_URL: z.url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .optional(),
})

export const env = envSchema.parse({
  NODE_ENV: import.meta.env.NODE_ENV,
  TURSO_DATABASE_URL: import.meta.env.TURSO_DATABASE_URL,
  TURSO_AUTH_TOKEN: import.meta.env.TURSO_AUTH_TOKEN,
  SENTRY_DSN: import.meta.env.SENTRY_DSN,
  APP_BASE_URL: import.meta.env.APP_BASE_URL,
  BETTER_AUTH_SECRET: import.meta.env.BETTER_AUTH_SECRET,
  LOG_LEVEL: import.meta.env.LOG_LEVEL,
  BETTER_AUTH_URL: import.meta.env.BETTER_AUTH_URL,
  UPSTASH_REDIS_REST_URL: import.meta.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: import.meta.env.UPSTASH_REDIS_REST_TOKEN,
})
