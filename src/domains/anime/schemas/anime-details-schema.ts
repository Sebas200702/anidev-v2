/**
 * Zod schemas for anime detail page API payloads.
 *
 * @module domains/anime/schemas/anime-details-schema
 */
import { z } from 'zod'
import { createApiResponseSchema } from '@shared/schemas/api-schema'

/**
 * Validates the primary anime detail payload for public pages.
 *
 * @remarks
 * **Response DTO** from {@link mapAnimeDetails} / {@link animeService.getAnimeDetails}.
 * All URL fields use `z.url()`; taxonomy fields are string arrays (names only).
 */
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

/**
 * **Request schema** for anime detail routes (`GET /api/anime/:malId`).
 *
 * @remarks
 * `malId` coerced from path string to positive integer.
 */
export const getAnimeDetailsSchema = z.object({
  params: z.object({
    malId: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional().default({}),
  body: z.unknown().optional(),
})

/**
 * **Response schema** — `{ data: AnimeDetails }` envelope.
 */
export const animeDetailsResponseSchema =
  createApiResponseSchema(animeDetailsSchema)
