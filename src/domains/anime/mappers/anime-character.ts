import type { AnimeCharacter } from '@/domains/anime/types/anime-character'
import type {
  AnimeCharacterDB,
  CharacterDB,
  StaffDB,
  CharacterVoiceActorDB,
} from '@/domains/anime/types/anime-db'
import { config } from '@/config'
import { buildMediaUrl } from '@/domains/media/mappers/media-url'
export const mapAnimeCharacters = ({
  refs,
  characters,
  voiceRelations,
  staff,
}: {
  refs: AnimeCharacterDB[]
  characters: CharacterDB[]
  voiceRelations: CharacterVoiceActorDB[]
  staff: StaffDB[]
}): AnimeCharacter[] => {
  const characterMap = new Map(characters.map((c) => [c.malId, c]))

  const staffMap = new Map(staff.map((s) => [s.malId, s]))

  const voiceMap = new Map<number, CharacterVoiceActorDB[]>()
  for (const vr of voiceRelations) {
    const list = voiceMap.get(vr.characterId) ?? []
    list.push(vr)
    voiceMap.set(vr.characterId, list)
  }

  return refs.map((ref) => {
    const character = characterMap.get(ref.characterId)
    if (!character) {
      throw new Error(
        `[mapAnimeCharacters] Character ${ref.characterId} not found`
      )
    }

    const voices: AnimeCharacter['voiceActors'] = []
    for (const vr of voiceMap.get(ref.characterId) ?? []) {
      const person = staffMap.get(vr.staffId)
      if (!person) continue

      voices.push({
        person: {
          malId: person.malId,
          url: `${config.baseUrl}/people/${person.malId}`,
          name: person.name,
          imageUrl: buildMediaUrl({
            entity: 'staff',
            entity_id: person.malId,
            type: 'poster',
            size: 'small',
            source: 'myanimelist',
          }),
        },
        language: vr.language,
      })
    }

    return {
      malId: character.malId,
      url: `${config.baseUrl}/characters/${character.malId}`,
      name: character.name,
      role: ref.role,
      imageUrl: buildMediaUrl({
        entity: 'character',
        entity_id: character.malId,
        type: 'poster',
        size: 'small',
        source: 'myanimelist',
      }),
      about: character.about ?? null,
      nameKanji: character.nameKanji ?? null,
      voiceActors: voices,
    }
  })
}
