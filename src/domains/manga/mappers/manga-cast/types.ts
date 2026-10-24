/**
 * Input types of the printed-media cast mapper.
 *
 * @module domains/manga/mappers/manga-cast/types
 */

/** A cast row: character, role and name. */
export interface MangaCastRow {
  characterId: number
  name: string
  role: string
}

/** A voice credit of a cast character. */
export interface MangaVoiceActorInput {
  characterId: number
  staffId: number
  name: string
  language: string
}
