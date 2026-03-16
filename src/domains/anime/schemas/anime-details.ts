import { z } from 'zod'
import { createApiResponseSchema } from '@/core/http/schemas/api-response'

export const animeDetailsSchema = z.object({
  malId: z.number(),
  title: z.string(),
  year: z.number(),
  status: z.string(),
  genres: z.array(z.string()),
  themes: z.array(z.string()),
  synopsis: z.string(),
  demographics: z.array(z.string()),
  trailerUrl: z.url(),
  imageUrl: z.url(),
  smallImageUrl: z.url(),
  bannerImageUrl: z.url(),
  url: z.url(),
  slug: z.string(),
  shareText: z.string(),
  watchUrl: z.string(),
  altImageText: z.string(),
})

export const getAnimeDetailsSchema = z.object({
  params: z.object({
    malId: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional().default({}),
  body: z.unknown().optional(),
})

export const animeDetailsResponseSchema =
  createApiResponseSchema(animeDetailsSchema)
