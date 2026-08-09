/**
 * @module domains/media/repositories/anime-media/types
 * @remarks Parameter shapes for anime media repository queries.
 */

/** Parameters for filtering anime media by entity ID and media type. */
export interface GetAnimeMediaByTypeParams {
  mediaType: string
  animeId: number
}
