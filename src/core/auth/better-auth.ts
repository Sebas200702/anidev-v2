import { betterAuth } from 'better-auth'
import { env } from '@/config/env'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/core/db/client'
import {
  account,
  session,
  user,
  verification,
} from '@/core/db/schemas/auth-schema'

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
  },
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
})
