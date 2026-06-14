/**
 * Domain types for music list and filter payloads.
 *
 * @module domains/music/types/music-list
 */
import {
  musicListFiltersParamsSchema,
  musicListFiltersSchema,
  musicListResponseSchema,
} from '@domains/music/schemas/music-list-schema'
import { z } from 'zod'

/**
 * Normalized list filters used by repositories and cache keys.
 *
 * @remarks
 * `type` is normalized to DB codes (`OP`, `ED`, `UNK`) via {@link mapMusicListFilters}.
 *
 * @see {@link musicListRepository}
 * @see {@link musicListCache}
 */
export type MusicListFilters = z.infer<typeof musicListFiltersSchema>

/**
 * Raw query parameters for music list requests (pre-mapper).
 *
 * @see {@link musicListFiltersParamsSchema}
 */
export type MusicListFiltersParams = z.infer<
  typeof musicListFiltersParamsSchema
>

/**
 * API response wrapping a paginated music card array.
 */
export type MusicListResponse = z.infer<typeof musicListResponseSchema>
