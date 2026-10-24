/**
 * Maps the cast rows of a printed work (with their voice actors) to DTOs.
 *
 * @module domains/manga/mappers/manga-cast/mapper
 */
import { buildMediaUrl } from '@media/mappers/media-url'
import type { MangaCastMember } from '@manga/types'
import type { MangaCastRow, MangaVoiceActorInput } from './types'

/**
 * Groups the voice actor credits by character and builds the cast DTOs.
 *
 * @param characters - Cast rows (already free of provisional names)
 * @param voiceActors - Voice credits of those characters
 * @returns Cast members in input order, each with its voice actors
 *
 * @example
 * ```ts
 * mapMangaCast([{ characterId: 5, name: 'Guts', role: 'Main' }], [])
 * // → [{ characterId: 5, name: 'Guts', role: 'Main', imageUrl, voiceActors: [] }]
 * ```
 */
export const mapMangaCast = (
  characters: MangaCastRow[],
  voiceActors: MangaVoiceActorInput[]
): MangaCastMember[] => {
  const voicesByCharacter = Map.groupBy(voiceActors, (v) => v.characterId)

  return characters.map(({ characterId, name, role }) => ({
    characterId,
    name,
    role,
    imageUrl: buildMediaUrl({
      entity: 'character',
      type: 'poster',
      size: 'small',
      entity_id: characterId,
    }),
    voiceActors: (voicesByCharacter.get(characterId) ?? []).map(
      ({ staffId, name: actorName, language }) => ({
        staffId,
        name: actorName,
        language,
        imageUrl: buildMediaUrl({
          entity: 'staff',
          type: 'poster',
          size: 'small',
          entity_id: staffId,
        }),
      })
    ),
  }))
}
