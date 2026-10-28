/**
 * Row types of the printed-media cast repository.
 *
 * @module domains/manga/repositories/manga-cast/types
 */

/** A voice actor credit of a cast character, with the actor name. */
export interface MangaVoiceActorRow {
  characterId: number
  staffId: number
  language: string
  name: string
}
