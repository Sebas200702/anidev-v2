/**
 * @module lib/db/schemas/auth-schema
 *
 * Better Auth persistence layer: user accounts, sessions, linked OAuth/credential
 * accounts, and verification tokens. Drizzle relation helpers live in the
 * sibling `auth-relations` module, which imports the tables from here.
 *
 * @remarks
 * Table and column names follow Better Auth Drizzle adapter conventions.
 * Timestamps use PostgreSQL timestamps with `now()` defaults. Cascading
 * deletes on `userId` foreign keys remove orphaned sessions and accounts.
 *
 * @see {@link module:lib/auth/server} for adapter registration
 * @see {@link module:lib/db/schemas/auth-relations} for the relation graph
 * @see {@link module:lib/db/schemas/profile} for extended user profile data
 */
import { sql } from 'drizzle-orm'
import { pgTable, text, boolean, timestamp, index } from 'drizzle-orm/pg-core'

/**
 * Authenticated application user (`user` table).
 *
 * **Key columns:**
 * - `id` — Text primary key (Better Auth generated).
 * - `email` — Unique login identifier; required.
 * - `emailVerified` — Boolean gate for verified-only flows.
 * - `createdAt` / `updatedAt` — Millisecond timestamps, auto-maintained.
 *
 * @see {@link session} for active login sessions
 * @see {@link account} for provider-linked credentials
 */
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .default(sql`now()`)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

/**
 * Active login session (`session` table) bound to a user.
 *
 * **Key columns:**
 * - `token` — Unique session token stored in HTTP-only cookie.
 * - `expiresAt` — Hard expiry; expired tokens must be rejected.
 * - `userId` — FK to {@link user.id}; indexed for lookup by user.
 *
 * @see {@link module:lib/db/schemas/auth-relations.sessionRelations} for Drizzle `user` join
 */
export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .default(sql`now()`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_userId_idx').on(table.userId)]
)

/**
 * OAuth or email/password provider account (`account` table) linked to a user.
 *
 * **Key columns:**
 * - `providerId` + `accountId` — Composite provider identity (e.g. google + sub).
 * - `password` — Hashed credential for email/password provider when present.
 * - Token columns — OAuth access/refresh tokens and expiry metadata.
 *
 * @see {@link module:lib/db/schemas/auth-relations.accountRelations} for Drizzle `user` join
 */
export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
      withTimezone: true,
    }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .default(sql`now()`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('account_userId_idx').on(table.userId)]
)

/**
 * Email or OTP verification challenge record (`verification` table).
 *
 * **Key columns:**
 * - `identifier` — Target email or subject being verified; indexed.
 * - `value` — Hashed or raw token depending on Better Auth flow.
 * - `expiresAt` — Challenge invalid after this timestamp.
 */
export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .default(sql`now()`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)]
)
