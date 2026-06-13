/**
 * @module lib/auth/server
 *
 * Server-side Better Auth configuration wired to the shared Drizzle database
 * client and auth schema tables. Exports the configured `auth` instance plus
 * inferred TypeScript types consumed by middleware, `App.Locals`, and the
 * typed browser client.
 *
 * @remarks
 * Server-only module: includes `BETTER_AUTH_SECRET` usage and must not be
 * imported from client islands. Email/password authentication is enabled;
 * OAuth providers would be added here via Better Auth plugins.
 *
 * @see {@link module:config/env} for `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`
 * @see {@link module:lib/db/schemas/auth-schema} for Drizzle table definitions
 * @see {@link module:lib/auth/client} for the typed browser client
 */
import { betterAuth } from 'better-auth'
import { env } from '@config/env'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@db/client'
import {
  account,
  session,
  user,
  verification,
} from '@db/schemas/auth-schema'

/**
 * Configured Better Auth server instance backed by Drizzle and SQLite/Turso.
 *
 * @remarks
 * Singleton for the process lifetime. Session cookies and token validation
 * are handled internally by Better Auth route handlers mounted under `/api/auth`.
 *
 * @see {@link Auth} for typeof alias used by the client generic
 */
export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.APP_BASE_URL,
  emailAndPassword: {
    enabled: true,
  },
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
})

/**
 * Better Auth instance type for generic binding on {@link authClient}.
 *
 * @remarks
 * Use this type rather than duplicating client method signatures when wrapping
 * auth in domain services.
 */
export type Auth = typeof auth

/**
 * Full session payload inferred from the configured auth instance, including
 * nested `session` and `user` objects returned by `getSession`.
 *
 * @see {@link User} for the user subset attached to `App.Locals`
 */
export type Session = typeof auth.$Infer.Session

/**
 * Authenticated user shape attached to `App.Locals.user` after middleware
 * resolution.
 *
 * @remarks
 * Excludes session metadata; use {@link Session} when expiry and token fields
 * are required.
 *
 * @see {@link module:types/env.d} for locals augmentation
 */
export type User = typeof auth.$Infer.Session.user
