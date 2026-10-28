/**
 * Zod schemas for anime detail page API payloads.
 *
 * @module domains/anime/schemas/anime-details-schema
 */
import { z } from 'zod'
import { mediaUrlSchema } from '@media/schemas'
import { createApiResponseSchema } from '@shared/schemas/api-schema'

/**
 * Validates the primary anime detail payload for public pages.
 *
 * @remarks
 * **Response DTO** from {@link mapAnimeDetails} / {@link animeService.getAnimeDetails}.
 * Image fields (`imageUrl`, `smallImageUrl`, `bannerImageUrl`) use
 * {@link mediaUrlSchema} (absolute or origin-relative `/media/...`); external
 * MAL links (`trailerUrl`, `url`) stay `z.url()`. Taxonomy fields are string
 * arrays (names only).
 *
 * `trailerUrl` is the one exception to "external MAL links stay absolute":
 * when the anime has no trailer row, {@link mapAnimeDetails} falls back to
 * `mediaServiceConfig.defaultPlaceholderUrl`, a media asset served by the
 * `/media` proxy (origin-relative since the img-src 'self' fix) — hence
 * `mediaUrlSchema` there too.
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
  // MAL trailer when present (absolute); the no-trailer fallback is the
  // origin-relative placeholder served by /media — see schema remarks.
  trailerUrl: mediaUrlSchema,
  imageUrl: mediaUrlSchema,
  smallImageUrl: mediaUrlSchema,
  bannerImageUrl: mediaUrlSchema,
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
