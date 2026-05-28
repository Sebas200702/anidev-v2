/**
 * Domain types for full anime detail payloads.
 *
 * @module domains/anime/types/anime-full
 */
import {
  animeExternalIdsSchema,
  animeGenreSchema,
  animeMediaSchema,
  animeRelationsSchema,
  animeTitleSchema,
  animeMusicSchema,
  animeFullDetailsSchema,
  animeFullDetailsResponseSchema,
} from '@domains/anime/schemas/anime-full-schema'
import { z } from 'zod'

/**
 * Expanded anime detail payload returned by the full endpoint.
 *
 * @see {@link animeFullService.getAnimeFullByMalId}
 * @see {@link mapAnimeToFullDetails}
 */
export type AnimeFullDetails = z.infer<typeof animeFullDetailsSchema>

/**
 * Related anime reference within a relation group.
 */
export type AnimeRelations = z.infer<typeof animeRelationsSchema>

/**
 * Alternate title variant for an anime (`main` | `english` | `japanese` | `synonym`).
 */
export type AnimeTitle = z.infer<typeof animeTitleSchema>

/**
 * Genre, theme, or demographic entry with both `name` and taxonomy `malId`.
 */
export type AnimeGenre = z.infer<typeof animeGenreSchema>

/**
 * Media asset (trailer, image, etc.) attached to full detail responses.
 */
export type AnimeMedia = z.infer<typeof animeMediaSchema>

/**
 * Opening or ending theme row in full detail `music` section.
 */
export type AnimeMusic = z.infer<typeof animeMusicSchema>

/**
 * External catalog identifier (`kitsu`, `tvdb`, `animeThemes`, …).
 */
export type AnimeExternalIds = z.infer<typeof animeExternalIdsSchema>

/**
 * API envelope `{ data: AnimeFullDetails }` for typed route handlers.
 */
export type AnimeFullDetailsResponse = z.infer<
  typeof animeFullDetailsResponseSchema
>
