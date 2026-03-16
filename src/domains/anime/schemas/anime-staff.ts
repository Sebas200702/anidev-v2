import { z } from 'zod'
import { createApiResponseSchema } from '@/core/http/schemas/api-response'
export const personSchema = z.object({
  malId: z.number(),
  url: z.url(),
  name: z.string(),
  imageUrl: z.url().nullable(),
})

export const animeStaffSchema = z.object({
  person: personSchema,
  positions: z.array(z.string()),
})

export const getAnimeStaffSchema = z.object({
  params: z.object({
    malId: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional().default({}),
  body: z.unknown().optional(),
})

export const animeStaffResponseSchema = createApiResponseSchema(z.array(animeStaffSchema))
