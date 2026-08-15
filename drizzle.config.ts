/**
 * @module drizzle.config
 *
 * Drizzle Kit configuration for the PostgreSQL database. Supplies the
 * connection string, dialect, and migration output folder so `db:generate`
 * and `db:migrate` operate against PostgreSQL.
 *
 * @remarks
 * Loads the environment file named by `ENV_FILE` (defaults to `.env`) with
 * `override: true`, so the selected file wins over any values Bun auto-loaded,
 * then reads `DATABASE_URL` from it. Schema modules live under
 * `src/lib/db/schemas`.
 */
import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config({ path: process.env.ENV_FILE ?? '.env', override: true })

export default defineConfig({
  schema: './src/lib/db/schemas/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
})
