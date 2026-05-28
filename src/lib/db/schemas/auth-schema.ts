/**
 * @module lib/db/schemas/auth-schema
 *
 * Better Auth persistence layer: user accounts, sessions, linked OAuth/credential
 * accounts, and verification tokens. Includes Drizzle relation helpers for
 * eager-loading sessions and accounts from a user root.
 *
 * @remarks
 * Table and column names follow Better Auth Drizzle adapter conventions.
 * Timestamps use SQLite integer milliseconds with SQL defaults. Cascading
 * deletes on `userId` foreign keys remove orphaned sessions and accounts.
 *
 * @see {@link module:lib/auth/server} for adapter registration
 * @see {@link module:lib/db/schemas/profile} for extended user profile data
 */
import { relations, sql } from 'drizzle-orm'
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core'

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
export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' })
    .default(false)
    .notNull(),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
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
 * @see {@link sessionRelations} for Drizzle `user` join
 */
export const session = sqliteTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_userId_idx').on(table.userId)],
)

/**
 * OAuth or email/password provider account (`account` table) linked to a user.
 *
 * **Key columns:**
 * - `providerId` + `accountId` — Composite provider identity (e.g. google + sub).
 * - `password` — Hashed credential for email/password provider when present.
 * - Token columns — OAuth access/refresh tokens and expiry metadata.
 *
 * @see {@link accountRelations} for Drizzle `user` join
 */
export const account = sqliteTable(
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
    accessTokenExpiresAt: integer('access_token_expires_at', {
      mode: 'timestamp_ms',
    }),
    refreshTokenExpiresAt: integer('refresh_token_expires_at', {
      mode: 'timestamp_ms',
    }),
    scope: text('scope'),
    password: text('password'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('account_userId_idx').on(table.userId)],
)

/**
 * Email or OTP verification challenge record (`verification` table).
 *
 * **Key columns:**
 * - `identifier` — Target email or subject being verified; indexed.
 * - `value` — Hashed or raw token depending on Better Auth flow.
 * - `expiresAt` — Challenge invalid after this timestamp.
 */
export const verification = sqliteTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
)

/**
 * Drizzle relation graph: user → many sessions and accounts.
 *
 * @see {@link user} root entity
 */
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}))

/**
 * Drizzle relation: session → one owning user.
 *
 * @see {@link session.userId} foreign key
 */
export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

/**
 * Drizzle relation: account → one owning user.
 *
 * @see {@link account.userId} foreign key
 */
export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))
