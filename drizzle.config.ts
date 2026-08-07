/**
 * @module drizzle.config
 *
 * Drizzle Kit configuration for the PostgreSQL database. Supplies the
 * connection string, dialect, and migration output folder so `db:generate`
 * and `db:migrate` operate against PostgreSQL.
 *
 * @remarks
 * Reads `DATABASE_URL` from the environment (loaded from `.env` via `dotenv`)
 * and points at the Drizzle schema modules under `src/lib/db/schemas`.
 */
import { defineConfig } from 'drizzle-kit'
import 'dotenv/config'

export default defineConfig({
  schema: './src/lib/db/schemas/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
})
