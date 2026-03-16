import { createApiResponseSchema } from '@/core/http/schemas/api-response'

import { z } from 'zod'

export const animeMediaSchema = z.object({
  mediaType: z.string(),
  src: z.string().optional(),
  size: z.string(),
})

export const animeRelationsSchema = z.object({
  relatedId: z.number(),
  title: z.string(),
  url: z.url(),
})

export const animeTitleSchema = z.object({
  title: z.string(),
  type: z.enum(['main', 'english', 'japanese', 'synonym']),
})

export const animeGenreSchema = z.object({
  name: z.string(),
  malId: z.number(),
})

export const animeMusicSchema = z.object({
  order: z.number(),
  title: z.string(),
  type: z.enum(['opening', 'ending']),
  url: z.url(),
})

export const animeExternalIdsSchema = z.object({
  id: z.union([z.number(), z.string()]),
  source: z.string(),
})

export const animeFullDetailsSchema = z.object({
  malId: z.number(),
  title: z.string(),
  titles: z.array(animeTitleSchema),
  year: z.number(),
  score: z.number(),
  scoredBy: z.number(),
  popularityRank: z.number(),
  rating: z.string(),
  season: z.string(),
  background: z.string(),
  status: z.string(),
  genres: z.array(animeGenreSchema),
  themes: z.array(animeGenreSchema),
  demographics: z.array(animeGenreSchema),
  synopsis: z.string(),
  media: z.array(animeMediaSchema),
  relations: z.array(
    z.object({
      relation: z.string(),
      entry: z.array(animeRelationsSchema),
    })
  ),
  type: z.string(),
  episodes: z.number(),
  music: z.object({
    openings: z.array(animeMusicSchema),
    endings: z.array(animeMusicSchema),
  }),
  externalIds: z.array(animeExternalIdsSchema),
})
export const animeFullDetailsResponseSchema = createApiResponseSchema(
  animeFullDetailsSchema
)

export const getAnimeFullSchema = z.object({
  params: z.object({
    malId: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional().default({}),
  body: z.unknown().optional(),
})
