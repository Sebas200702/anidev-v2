import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { env } from '@/config/env'

const tursoClient = createClient({
  url: env.TURSO_DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN,
})

export const db = drizzle(tursoClient)
