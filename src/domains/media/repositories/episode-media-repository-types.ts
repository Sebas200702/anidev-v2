/**
 * @module @media/repositories/episode-media-repository-types
 * @remarks Parameter shapes for episode media repository queries.
 */

export interface GetEpisodeMediaByTypeParams {
  mediaType: string
  episodeId: number
}
