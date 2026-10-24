/**
 * Maps `episode` rows into episode catalog API payloads.
 *
 * @module domains/anime/mappers/anime-episode/mapper
 */
import type {
  AnimeEpisodeDetail,
  AnimeEpisodeItem,
  EpisodeDB,
} from '@anime/types'
import { EPISODE_THUMBNAIL_MEDIA_TYPE } from '@media/constants'
import { buildMediaUrl } from '@media/mappers/media-url'

/**
 * Maps one row to a list item.
 *
 * @remarks
 * Drops `animeId` (implied by the route) and `synopsis` (detail only). The
 * thumbnail is keyed by `episode.id` (the `episode_media` FK) and always
 * resolves: `/media` falls back to the placeholder while no asset exists.
 */
const mapAnimeEpisodeItem = ({
  id,
  number,
  title,
  duration,
  aired,
}: EpisodeDB): AnimeEpisodeItem => ({
  id,
  number,
  title,
  duration,
  aired,
  imageUrl: buildMediaUrl({
    entity: 'episode',
    entity_id: id,
    type: EPISODE_THUMBNAIL_MEDIA_TYPE,
  }),
  altImageText: `Image for Episode ${number}: ${title}`,
})

/**
 * Maps a page of rows to {@link AnimeEpisodeItem}s, preserving order.
 *
 * @param rows - `episode` rows already ordered by number
 * @returns List items without synopsis
 *
 * @see {@link animeEpisodesService.getEpisodes}
 */
export const mapAnimeEpisodeItems = (rows: EpisodeDB[]): AnimeEpisodeItem[] =>
  rows.map(mapAnimeEpisodeItem)

/**
 * Maps one row to an {@link AnimeEpisodeDetail} with its synopsis.
 *
 * @param row - The `episode` row
 * @returns Detail payload; `duration` / `aired` are the unparsed source text
 *
 * @see {@link animeEpisodesService.getEpisode}
 */
export const mapAnimeEpisodeDetail = (row: EpisodeDB): AnimeEpisodeDetail => ({
  ...mapAnimeEpisodeItem(row),
  synopsis: row.synopsis,
})
