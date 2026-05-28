/**
 * @module lib/db/config
 *
 * Static database tuning defaults for connection limits, timeouts, and batch
 * chunk sizes. Consumed by repository helpers and import scripts that split
 * large inserts or parallelize reads without hard-coding magic numbers.
 *
 * @remarks
 * Values are not loaded from environment — change here for global policy.
 * Turso/LibSQL may enforce its own platform limits regardless of these settings.
 *
 * @see {@link dbConfig} for the exported configuration object
 * @see {@link module:lib/db/client} for the database client
 */
/**
 * Runtime database limits used by batch importers and connection helpers.
 *
 * @property maxConnections - Upper bound for concurrent logical connections
 * in worker pools or parallel batch jobs (default `10`). Exceeding risks
 * throttling from Turso; lowering reduces parallelism.
 * @property connectionTimeout - Milliseconds to wait before failing a connect
 * or handshake attempt (default `5000`). Does not cap individual query duration.
 * @property chunkSize - Maximum rows per batched insert/update statement
 * (default `500`). Larger chunks reduce round trips but may hit SQLite variable limits.
 *
 * @example
 * ```typescript
 * import { dbConfig } from '@db/config'
 *
 * for (let i = 0; i < rows.length; i += dbConfig.chunkSize) {
 *   const chunk = rows.slice(i, i + dbConfig.chunkSize)
 *   await db.insert(table).values(chunk)
 * }
 * ```
 */
export const dbConfig = {
  maxConnections: 10,
  connectionTimeout: 5000,
  chunkSize: 500,
}
