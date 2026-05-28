import type { AnimeStaff } from '@/domains/anime/types/anime-staff'
import type {
  StaffDB,
  AnimeStaffDB,
} from '@/domains/anime/types/anime-db'
import { config } from '@/config'
import { buildMediaUrl } from '@/domains/media/mappers/media-url'
export const mapAnimeStaff = ({
  staff,
  animeStaff,
}: {
  staff: StaffDB[]
  animeStaff: AnimeStaffDB[]
}): AnimeStaff[] => {
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
