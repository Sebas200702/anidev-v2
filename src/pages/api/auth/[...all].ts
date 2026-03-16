import type { APIRoute } from 'astro'
import { auth } from '@/core/auth/better-auth'

export const ALL: APIRoute = async (ctx) => {
  return auth.handler(ctx.request)
}
