/**
 * Zod schemas for the printed-media (manga) detail payload.
 *
 * @module domains/manga/schemas/manga-details-schema
 */
import { z } from 'zod'
import { createApiResponseSchema } from '@shared/schemas/api-schema'

/**
 * Validates a cast member: the character, its role and its voice actors.
 *
 * @remarks
 * Voice actors come from the anime adaptations of the shared character
 * (`character_voice_actor`); a character without adaptation has `[]`.
 */
export const mangaCastMemberSchema = z.object({
  characterId: z.number(),
  name: z.string(),
  role: z.string(),
  imageUrl: z.url(),
  voiceActors: z.array(
    z.object({
      staffId: z.number(),
      name: z.string(),
      language: z.string(),
      imageUrl: z.url(),
    })
  ),
})

/**
 * Validates the printed-media detail payload.
 *
 * @remarks
 * Taxonomy is exposed as arrays of names; the cast and the staff carry their
 * role so the page can group them without another round-trip.
 */
export const mangaDetailsSchema = z.object({
  malId: z.number(),
  title: z.string(),
  titleEnglish: z.string().nullable(),
  titleJapanese: z.string().nullable(),
  type: z.string(),
  status: z.string(),
  year: z.number(),
  chapters: z.number().nullable(),
  volumes: z.number().nullable(),
  score: z.number().nullable(),
  synopsis: z.string(),
  background: z.string(),
  serialization: z.string().nullable(),
  countryOfOrigin: z.string().nullable(),
  publishedFrom: z.string().nullable(),
  publishedTo: z.string().nullable(),
  genres: z.array(z.string()),
  themes: z.array(z.string()),
  demographics: z.array(z.string()),
  imageUrl: z.url(),
  smallImageUrl: z.url(),
  bannerImageUrl: z.url(),
  characters: z.array(mangaCastMemberSchema),
  staff: z.array(
    z.object({
      staffId: z.number(),
      name: z.string(),
      role: z.string(),
      imageUrl: z.url(),
    })
  ),
  publishers: z.array(
    z.object({
      producerId: z.number(),
      name: z.string(),
      role: z.string(),
    })
  ),
  related: z.array(
    z.object({
      mangaId: z.number(),
      title: z.string(),
      relationType: z.string(),
    })
  ),
  externalLinks: z.array(
    z.object({
      site: z.string(),
      url: z.url(),
      type: z.string().nullable(),
    })
  ),
  slug: z.string(),
  url: z.url(),
  altImageText: z.string(),
})

/**
 * **Request schema** for printed-media detail routes (`GET /api/manga/:malId`
 * and `GET /api/manga/:malId/full`).
 */
export const getMangaDetailsSchema = z.object({
  params: z.object({
    malId: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional().default({}),
  body: z.unknown().optional(),
})

/** **Response schema** — `{ data: MangaDetails }` envelope. */
export const mangaDetailsResponseSchema =
  createApiResponseSchema(mangaDetailsSchema)
