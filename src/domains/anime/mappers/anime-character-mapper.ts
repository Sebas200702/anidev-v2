/**
 * Maps database character and staff rows into anime character payloads.
 *
 * @module domains/anime/mappers/anime-character-mapper
 */
import type {
  AnimeCharacter,
  AnimeCharacterDB,
  CharacterDB,
  CharacterVoiceActorDB,
  StaffDB,
} from '@domains/anime/types'
import { config } from '@/config'
import { buildMediaUrl } from '@domains/media/mappers/media-url-mapper'
import { DomainError } from '@shared/errors/app-error'
import { ErrorCodes } from '@shared/errors/codes'

/**
 * Input for assembling anime character payloads.
 */
type MapAnimeCharactersInput = {
  refs: AnimeCharacterDB[]
  characters: CharacterDB[]
  voiceRelations: CharacterVoiceActorDB[]
  staff: StaffDB[]
}

/**
 * Maps join-table references and related rows into {@link AnimeCharacter} payloads.
 *
 * @param input - Character references, rows, and voice actor relations
 * @returns Cast list in join-table order
 *
 * @throws {Error} When a join `characterId` has no matching `character` row
 *
 * @remarks
 * **Lookups:** `Map` by `malId` for characters and staff; voice relations grouped
 * per `characterId`.
 *
 * **Voice actors:** Skips voice rows whose `staffId` is missing from `staffMap`
 * (partial sync) rather than failing.
 *
 * **URLs:** Character page `/characters/{id}`; staff poster URLs via CDN helper.
 *
 * @see {@link animeCharacterService}
 */
export const mapAnimeCharacters = ({
  refs,
  characters,
  voiceRelations,
  staff,
}: MapAnimeCharactersInput): AnimeCharacter[] => {
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
      throw new DomainError(
        ErrorCodes.ANIME_CHARACTER_NOT_FOUND,
        `Character ${ref.characterId} not found — referenced by anime ${ref.animeId} but missing from character table`,
        { characterId: ref.characterId, animeId: ref.animeId }
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
