/**
 * Maps database staff rows into anime staff API payloads.
 *
 * @module domains/anime/mappers/anime-staff-mapper
 */
import type { AnimeStaff, AnimeStaffDB, StaffDB } from '@domains/anime/types'
import { config } from '@/config'
import { buildMediaUrl } from '@domains/media/mappers/media-url-mapper'

/**
 * Input for assembling anime staff payloads.
 */
type MapAnimeStaffInput = {
  /** `staff` rows keyed by `malId` */
  staff: StaffDB[]
  /** `anime_staff` join rows with comma-separated `role` */
  animeStaff: AnimeStaffDB[]
}

/**
 * Maps staff rows and join-table roles into {@link AnimeStaff} payloads.
 *
 * @param input - Staff rows and anime-staff relations
 * @returns One entry per staff person with split position strings
 *
 * @remarks
 * **Role splitting:** `anime_staff.role` is split on `','` into `positions`.
 *
 * **Edge case:** When no join row matches a staff ID, `positions` defaults to
 * `['Unknown']` (should not occur if repos stay in sync).
 *
 * **URLs:** Person profile at `/people/{malId}`; images via {@link buildMediaUrl}.
 *
 * @see {@link animeStaffService}
 * @see {@link animeStaffSchema}
 */
export const mapAnimeStaff = ({
  staff,
  animeStaff,
}: MapAnimeStaffInput): AnimeStaff[] => {
  return staff.map((s) => ({
    person: {
      malId: s.malId,
      name: s.name,
      imageUrl: buildMediaUrl({
        entity: 'staff',
        entity_id: s.malId,
        type: 'poster',
        size: 'small',
        source: 'myanimelist',
      }),
      url: `${config.baseUrl}/people/${s.malId}`,
    },
    positions: animeStaff
      .find((as) => as.staffId === s.malId)
      ?.role.split(',') || ['Unknown'],
  }))
}
