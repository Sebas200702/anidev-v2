/**
 * Type definitions for the anime character mapper.
 *
 * @module domains/anime/mappers/anime-character-mapper-types
 */
import type {
  AnimeCharacterDB,
  CharacterDB,
  CharacterVoiceActorDB,
  StaffDB,
} from '@anime/types'

/**
 * Input for assembling anime character payloads.
 */
export interface MapAnimeCharactersInput {
  refs: AnimeCharacterDB[]
  characters: CharacterDB[]
  voiceRelations: CharacterVoiceActorDB[]
  staff: StaffDB[]
}
