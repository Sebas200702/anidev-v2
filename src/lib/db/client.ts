/**
 * @module lib/db/client
 *
 * Singleton Drizzle ORM client connected to the remote Turso SQLite database
 * through `@libsql/client`. Used by repositories, Better Auth adapter, and
 * any server-side query path requiring typed SQL access.
 *
 * @remarks
 * Connection is established at module import using validated environment
 * variables. There is no explicit connection pool API — LibSQL client manages
 * HTTP/WebSocket transport internally. Long-running batch jobs should respect
 * {@link module:lib/db/config.dbConfig.chunkSize} to avoid oversized statements.
 *
 * @see {@link module:config/env} for `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`
 * @see {@link db} for the exported Drizzle instance
 * @see {@link module:lib/db/schemas} for table definitions passed to queries
 */
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { env } from '@config/env'

/** Internal LibSQL client; prefer {@link db} for queries. */
const tursoClient = createClient({
  url: env.TURSO_DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN,
})

/**
 * Shared Drizzle database client for repositories, auth adapter, and services.
 *
 * @remarks
 * Not wrapped with schema generic at export site — repositories import table
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
export const db = drizzle(tursoClient)
