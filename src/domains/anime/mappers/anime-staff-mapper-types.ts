/**
 * Type definitions for the anime staff mapper.
 *
 * @module domains/anime/mappers/anime-staff-mapper-types
 */
import type { AnimeStaffDB, StaffDB } from '@anime/types'

/**
 * Input for assembling anime staff payloads.
 */
export interface MapAnimeStaffInput {
  /** `staff` rows keyed by `malId` */
  staff: StaffDB[]
  /** `anime_staff` join rows with comma-separated `role` */
  animeStaff: AnimeStaffDB[]
}
