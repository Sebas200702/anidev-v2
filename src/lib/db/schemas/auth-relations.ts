/**
 * @module lib/db/schemas/auth-relations
 *
 * Drizzle relation graph for the Better Auth persistence layer, kept separate
 * from the table definitions so neither file grows past the line budget.
 *
 * @see {@link module:lib/db/schemas/auth-schema} for the table definitions
 */
import { relations } from 'drizzle-orm'
import { account, session, user } from '@db/schemas/auth-schema'

/**
 * Drizzle relation graph: user → many sessions and accounts.
 *
 * @see {@link module:lib/db/schemas/auth-schema.user} root entity
 */
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}))

/**
 * Drizzle relation: session → one owning user.
 *
 * @see {@link module:lib/db/schemas/auth-schema.session.userId} foreign key
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
 * @see {@link module:lib/db/schemas/auth-schema.account.userId} foreign key
 */
export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))
