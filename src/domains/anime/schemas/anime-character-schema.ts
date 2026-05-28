/**
 * Zod schemas for anime character API payloads.
 *
 * @module domains/anime/schemas/anime-character-schema
 */
import { z } from 'zod'
import { createApiResponseSchema } from '@shared/schemas/api-schema'
import { personSchema } from '@domains/anime/schemas/anime-staff-schema'

/**
 * Validates a voice actor attached to a character.
 *
 * @remarks
 * - `person` — {@link personSchema}
 * - `language` — dub language label (e.g. Japanese, English)
 */
export const voiceActorSchema = z.object({
  person: personSchema,
  language: z.string(),
})

/**
 * Validates a character entry on an anime detail page.
 *
 * @remarks
 * **Response body** for `/api/anime/:malId/characters`.
 */
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

/**
 * **Request schema** — route params for character list requests.
 *
 * @remarks
 * - `params.malId` — `z.coerce.number().int().positive()`
 * - `query` — empty object default
 */
export const getAnimeCharacterSchema = z.object({
  params: z.object({
    malId: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional().default({}),
  body: z.unknown().optional(),
})

/**
 * **Response schema** — API envelope around `AnimeCharacter[]`.
 */
export const animeCharacterResponseSchema = createApiResponseSchema(
  z.array(animeCharacterSchema)
)
