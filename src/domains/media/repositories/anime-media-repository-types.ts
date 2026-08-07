/**
 * @module @media/repositories/anime-media-repository-types
 * @remarks Parameter shapes for anime media repository queries.
 */

/** Parameters for filtering anime media by entity ID and media type. */
export interface GetAnimeMediaByTypeParams {
  mediaType: string
  animeId: number
}
