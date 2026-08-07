/**
 * @module lib/db/client
 *
 * Singleton Drizzle ORM client connected to a PostgreSQL database through
 * `node-postgres`. Used by repositories, Better Auth adapter, and any
 * server-side query path requiring typed SQL access.
 *
 * @remarks
 * Built from a lazy `pg` {@link Pool} — no TCP connection is opened at module
 * import, so the application can start even when the database is temporarily
 * unreachable. Connections are acquired on demand per query; the pool retains
 * healthy connections and transparently recovers when the database returns.
 *
 * @see {@link module:config/env} for `DATABASE_URL`
 * @see {@link db} for the exported Drizzle instance
 * @see {@link module:lib/db/schemas} for table definitions passed to queries
 */
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { env } from '@config/env'

/** Internal PostgreSQL connection pool; prefer {@link db} for queries. */
const pool = new Pool({ connectionString: env.DATABASE_URL })

/**
 * Shared Drizzle database client for repositories, auth adapter, and services.
 *
 * @remarks
 * Not wrapped with a schema generic at export site — repositories import table
 * objects from `@db/schemas` and pass them to query builders explicitly.
 *
 * @example
 * ```typescript
 * import { db } from '@db/client'
 * import { anime } from '@db/schemas/anime'
 * import { eq } from 'drizzle-orm'
 *
 * const row = await db.select().from(anime).where(eq(anime.malId, 5114))
 * ```
 *
 * @see {@link module:lib/auth/server} for Better Auth Drizzle adapter usage
 */
export const db = drizzle(pool)
