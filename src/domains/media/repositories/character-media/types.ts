/**
 * @module domains/media/repositories/character-media/types
 * @remarks Parameter shapes for character media repository queries.
 */

/** Parameters for filtering character media by entity ID and media type. */
export interface GetCharacterMediaByTypeParams {
  mediaType: string
  characterId: number
}
