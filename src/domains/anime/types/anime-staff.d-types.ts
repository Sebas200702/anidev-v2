/**
 * Domain types for anime staff payloads.
 *
 * @module domains/anime/types/anime-staff
 */
import { animeStaffSchema } from '@domains/anime/schemas/anime-staff-schema'
import { z } from 'zod'

/**
 * Staff member and their credited positions on an anime.
 *
 * @remarks
 * `positions` is derived from comma-separated `anime_staff.role` values.
 * Defaults to `['Unknown']` when join data is missing (see {@link mapAnimeStaff}).
 *
 * @see {@link animeStaffService.getAnimeStaff}
 */
export type AnimeStaff = z.infer<typeof animeStaffSchema>
