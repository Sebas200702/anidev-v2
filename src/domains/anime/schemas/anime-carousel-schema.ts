/**
 * Zod schemas for the featured-anime carousel payload.
 *
 * @module domains/anime/schemas/anime-carousel-schema
 * @remarks
 * **Response schema** — validates the slides produced by
 * {@link animeCarouselService.getCarouselItems}.
 */
import { createApiResponseSchema } from '@shared/schemas/api-schema'
import { z } from 'zod'

/** Validates a genre chip rendered on a slide. */
export const carouselGenreSchema = z.object({
  malId: z.number(),
  name: z.string(),
  url: z.string(),
})

/**
 * Validates a single carousel slide.
 *
 * @remarks
 * `clearLogo` and `bannerImage` are proxied media URLs (empty string when the
 * anime has no such asset).
 */
export const carouselItemSchema = z.object({
  malId: z.number(),
  title: z.string(),
  clearLogo: z.string(),
  bannerImage: z.string(),
  description: z.string(),
  genres: z.array(carouselGenreSchema),
  score: z.number(),
  year: z.number(),
  season: z.string(),
})

/** **Response envelope** — `{ data: CarouselItem[] }`. */
export const animeCarouselResponseSchema = createApiResponseSchema(
  z.array(carouselItemSchema)
)

/** **Request schema** for `GET /api/anime/carousel` (no inputs). */
export const getAnimeCarouselSchema = z.object({
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
  body: z.unknown().optional(),
})
