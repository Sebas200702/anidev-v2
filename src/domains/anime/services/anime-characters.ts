import { animeCharacterRepository } from '@/domains/anime/repositories/anime-characters'
import { characterRepository } from '@/domains/anime/repositories/character'
import { characterStaffRepository } from '@/domains/anime/repositories/character-staff'
import { animeCharacterCache } from '@/domains/anime/cache/anime-character'
import { staffRepository } from '@/domains/anime/repositories/staff'
import { mapAnimeCharacters } from '@/domains/anime/mappers/anime-character'
import { withCache } from '@/core/cache'

export const animeCharacterService = {
  async getAnimeCharacters(animeId: number) {
    return withCache({
      key: animeCharacterCache.key(animeId),
      getCache: () => animeCharacterCache.get(animeId),
      setCache: (_, value) => animeCharacterCache.set(animeId, value),
      compute: async () => {
        const refs =
          await animeCharacterRepository.getCharacterRefsByAnimeId(animeId)

        const characterIds = refs.map((r) => r.characterId)

        const [characters, characterMedia, voiceRelations] = await Promise.all([
          characterRepository.getManyByMalIds(characterIds),
          animeCharacterRepository.getMediaByCharacterIds(characterIds),
          characterStaffRepository.getVoicesByCharacterIds(characterIds),
        ])

        const staffIds = [...new Set(voiceRelations.map((v) => v.staffId))]

        const [staff, staffMedia] = await Promise.all([
          staffRepository.getManyByMalIds(staffIds),
          staffRepository.getMediaByStaffIds(staffIds),
        ])

        return mapAnimeCharacters({
          refs,
          characters,
          characterMedia,
          voiceRelations,
          staff,
          staffMedia,
        })
      },
    })
  },
}
