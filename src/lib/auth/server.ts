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
import { account, session, user, verification } from '@db/schemas/auth-schema'
import { bootstrapGoogleProfile } from '@lib/auth/google-profile'

/**
 * Configured Better Auth server instance backed by Drizzle and PostgreSQL.
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
  // Pin the internal logger to `warn`: Better Auth logs an info line containing
  // the raw email on duplicate sign-up (`Sign-up attempt for existing email`),
  // and this option object is the only control it exposes (verified against
  // @better-auth/core `createLogger`: `{ disabled, level, disableColors, log }`,
  // default level `warn`). Errors still surface; our mapped auth errors keep
  // the cause in our own redacted logs.
  logger: { level: 'warn' },
  emailAndPassword: {
    enabled: true,
  },
  ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? {
        socialProviders: {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            scope: ['openid', 'email', 'profile'],
          },
        },
      }
    : {}),
  account: {
    accountLinking: {
      enabled: true,
      // Email ownership is never verified (no SMTP yet), so a same-email
      // Google sign-in must not open an existing password account: whoever
      // registered that email first could otherwise receive the victim's
      // Google login. Linking happens only from inside a session.
      disableImplicitLinking: true,
      trustedProviders: [],
    },
  },
  databaseHooks: {
    account: {
      create: {
        after: async (account) => {
          await bootstrapGoogleProfile(account)
        },
      },
    },
  },
  database: drizzleAdapter(db, {
    provider: 'pg',
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
