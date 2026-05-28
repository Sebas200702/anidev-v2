/**
 * Zod schemas for anime staff API payloads.
 *
 * @module domains/anime/schemas/anime-staff-schema
 */
import { z } from 'zod'
import { createApiResponseSchema } from '@shared/schemas/api-schema'

/**
 * Validates a person record shared by staff and voice actor payloads.
 *
 * @remarks
 * - `malId` — staff/person MAL ID
 * - `url` — `z.url()` profile link
 * - `imageUrl` — nullable CDN poster
 */
export const personSchema = z.object({
  malId: z.number(),
  url: z.url(),
  name: z.string(),
  imageUrl: z.url().nullable(),
})

/**
 * Validates a staff member and their credited positions on an anime.
 *
 * @remarks
 * `positions` — split role strings from `anime_staff.role` (see {@link mapAnimeStaff})
 */
export const animeStaffSchema = z.object({
  person: personSchema,
  positions: z.array(z.string()),
})

/**
 * **Request schema** for `GET /api/anime/:malId/staff`.
 */
export const getAnimeStaffSchema = z.object({
  params: z.object({
    malId: z.coerce.number().int().positive(),
  }),
  query: z.object({}).optional().default({}),
  body: z.unknown().optional(),
})

/**
 * **Response schema** — `AnimeStaff[]` in API envelope.
 */
export const animeStaffResponseSchema = createApiResponseSchema(
  z.array(animeStaffSchema)
)
