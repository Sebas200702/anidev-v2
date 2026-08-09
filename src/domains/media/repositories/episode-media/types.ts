/**
 * @module domains/media/repositories/episode-media/types
 * @remarks Parameter shapes for episode media repository queries.
 */

export interface GetEpisodeMediaByTypeParams {
  mediaType: string
  episodeId: number
}
