import { createApiResponseSchema } from '@/core/http/schemas/api-response'
import { animeCardSchema } from '@/domains/anime/schemas/anime-card'
import { z } from 'zod'
export const animeFiltersParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  genre: z.string().optional(),
  status: z.string().optional(),
  rating: z.string().optional(),
  year: z.coerce
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear())
    .optional(),
  type: z.string().optional(),
  query: z.string().optional(),
})

export const animeFiltersSchema = animeFiltersParamsSchema.extend({
  genre: z.array(z.string()).optional(),
  status: z.array(z.string()).optional(),
  rating: z.array(z.string()).optional(),
  type: z.array(z.string()).optional(),
})

export const animeListRequestSchema = z.object({
  params: z.object({}).optional().default({}),
  query: animeFiltersParamsSchema,
  body: z.unknown().optional(),
})

export const animeListResponseSchema = createApiResponseSchema(
  z.array(animeCardSchema)
)
