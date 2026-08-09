/**
 * Maps database staff rows into anime staff API payloads.
 *
 * @module domains/anime/mappers/anime-staff/mapper
 */
import type { AnimeStaff } from '@anime/types'
import { config } from '@/config'
import { buildMediaUrl } from '@media/mappers/media-url'
import type { MapAnimeStaffInput } from './types'

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
