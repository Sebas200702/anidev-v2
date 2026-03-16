import type { AnimeCharacter } from '@/domains/anime/types/anime-character'
import type {
  AnimeCharacterDB,
  CharacterDB,
  CharacterMediaDB,
  StaffDB,
  CharacterVoiceActorDB,
  StaffMediaDB,
} from '@/domains/anime/types/anime-db'
import {config} from '@/config'
export const mapAnimeCharacters = ({
  refs,
  characters,
  characterMedia,
  voiceRelations,
  staff,
  staffMedia,
}: {
  refs: AnimeCharacterDB[]
  characters: CharacterDB[]
  characterMedia: CharacterMediaDB[]
  voiceRelations: CharacterVoiceActorDB[]
  staff: StaffDB[]
  staffMedia: StaffMediaDB[]
}): AnimeCharacter[] => {

  const characterMap = new Map(characters.map((c) => [c.malId, c]))

  const characterImageMap = new Map<number, string | null>()
  for (const media of characterMedia) {
    if (!characterImageMap.has(media.characterId)) {
      characterImageMap.set(media.characterId, media.src)
    }
  }

  const staffMap = new Map(staff.map((s) => [s.malId, s]))

  const staffImageMap = new Map<number, string | null>()
  for (const media of staffMedia) {
    if (!staffImageMap.has(media.staffId)) {
      staffImageMap.set(media.staffId, media.src)
    }
  }


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
          imageUrl: staffImageMap.get(person.malId) ?? null,
        },
        language: vr.language,
      })
    }

    return {
      malId: character.malId,
      url: `${config.baseUrl}/characters/${character.malId}`,
      name: character.name,
      role: ref.role,
      imageUrl: characterImageMap.get(character.malId) ?? null,
      about: character.about ?? null,
      nameKanji: character.nameKanji ?? null,
      voiceActors: voices,
    }
  })
}
