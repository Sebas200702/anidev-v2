import { z } from 'zod'
import { createApiResponseSchema } from '@/core/http/schemas/api-response'
import { personSchema } from '@/domains/anime/schemas/anime-staff'


export const voiceActorSchema = z.object({
  person: personSchema,
  language: z.string(),
})
export const animeCharacterSchema = z.object({
  malId: z.number(),
  url: z.url(),
  name: z.string(),
  role: z.string(),
  imageUrl: z.url().nullable(),
  about: z.string().nullable(),
  nameKanji: z.string().nullable(),
  voiceActors: z.array(voiceActorSchema),
})
export const getAnimeCharacterSchema = z.object({
  params: z.object({
    malId: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional().default({}),
  body: z.unknown().optional(),
})

export const animeCharacterResponseSchema = createApiResponseSchema(
  z.array(animeCharacterSchema)
)
