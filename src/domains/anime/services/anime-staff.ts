import type { AnimeStaff } from '@/domains/anime/types/anime-staff'
import { animeStaffCache } from '@/domains/anime/cache/anime-staff'
import { staffRepository } from '@/domains/anime/repositories/staff'
import { withCache } from '@/core/cache'
import { mapAnimeStaff } from '@/domains/anime/mappers/anime-staff'
import { animeStaffRepository } from '@/domains/anime/repositories/anime-staff'


export const animeStaffService = {
  async getAnimeStaff(malId: number): Promise<AnimeStaff[]> {
    return withCache({
      key: animeStaffCache.key(malId),
      getCache: () => animeStaffCache.get(malId),
      setCache: (_, value) => animeStaffCache.set(malId, value),
      compute: async () => {
        const staffRefs =
          await animeStaffRepository.getAnimeStaffByAnimeMalId(malId)

        const staffIds = staffRefs.map((ref) => ref.staffId)
        const [staff, staffMedia] = await Promise.all([
          staffRepository.getManyByMalIds(staffIds),
          staffRepository.getMediaByStaffIds(staffIds),
        ])
        return mapAnimeStaff({
          staff,
          staffMedia,
          animeStaff: staffRefs,
        })
      },
    })
  },
}
