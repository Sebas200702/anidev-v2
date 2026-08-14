/**
 * @module lib/db/schemas/search-history
 *
 * Per-user, cross-domain search history (`search_history` table). Records
 * executed searches (free-text + filters) for an authenticated user across
 * content types (`scope`: anime, music, …) so they can review or clear them.
 * Best-effort writes; not on the catalog read path.
 *
 * @remarks
 * `userId` references {@link user.id} with cascade delete. Growth is bounded by
 * a per-user cap enforced at the repository layer (prune-on-record). The
 * `(user_id, created_at desc)` index serves recent-listing and clear.
 *
 * @see {@link module:lib/db/schemas/auth-schema.user} for the auth user root
 */
import {
  index,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import { user } from '@db/schemas/auth-schema'

/**
 * Authenticated user's executed anime searches (`search_history` table).
 *
 * **Key columns:**
 * - `id` — Serial primary key.
 * - `userId` — FK to {@link user.id}; cascade on delete.
 * - `scope` — Content type searched (`anime`, `music`, …) — the transversal discriminator.
 * - `query` — Optional free-text search term (filter-only searches have none).
 * - `filters` — Serialized normalized filters (JSONB).
 * - `createdAt` — Insertion timestamp; drives newest-first ordering.
 */
export const searchHistory = pgTable(
  'search_history',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    scope: text('scope').notNull(),
    query: text('query'),
    filters: jsonb('filters'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    index('search_history_user_created_idx').on(t.userId, t.createdAt.desc()),
  ]
)
