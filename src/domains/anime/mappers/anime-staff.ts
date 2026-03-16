import type { AnimeStaff } from '@/domains/anime/types/anime-staff'
import type {
  StaffDB,
  StaffMediaDB,
  AnimeStaffDB,
} from '@/domains/anime/types/anime-db'
import { config } from '@/config'
export const mapAnimeStaff = ({
  staff,
  staffMedia,
  animeStaff,
}: {
  staff: StaffDB[]
  staffMedia: StaffMediaDB[]
  animeStaff: AnimeStaffDB[]
}): AnimeStaff[] => {
  return staff.map((s) => ({
    person: {
      malId: s.malId,
      name: s.name,
      imageUrl:
        staffMedia.find((sm) => sm.staffId === s.malId)?.src || null,
      url: `${config.baseUrl}/people/${s.malId}`,
    },
    positions: animeStaff
      .find((as) => as.staffId === s.malId)
      ?.role.split(',') || ['Unknown'],
  }))
}
