/**
 * Maps database anime rows into card payloads for list views.
 *
 * @module domains/anime/mappers/anime-card-mapper
 */
import type { AnimeCard, AnimeDB } from '@domains/anime/types'
import { buildMediaUrl } from '@domains/media/mappers/media-url-mapper'

/** Input for mapping a single anime row to a card. */
type MapAnimeCardInput = {
  anime: AnimeDB
}

/** Input for mapping multiple anime rows to cards. */
type MapAnimeListToCardsInput = {
  animeList: AnimeDB[]
}

/**
 * Maps a single anime database row into an {@link AnimeCard}.
 *
 * @param input - Anime row from {@link animeListRepository}
 * @returns Compact card with poster URLs and display defaults
 *
 * @remarks
 * - `type` / `status` default to `'Unknown'`
 * - `year` uses `?? 0` (preserves `null` only via `??`, not `||`)
 * - `score` passed through nullable from DB
 *
 * @see {@link animeCardSchema}
 */
export const mapAnimeCard = ({ anime }: MapAnimeCardInput): AnimeCard => {
  const imageUrl = buildMediaUrl({
    entity: 'anime',
    entity_id: anime.malId,
    type: 'poster',
    size: 'large',
    source: 'myanimelist',
  })

  const smallImageUrl = buildMediaUrl({
    entity: 'anime',
    entity_id: anime.malId,
    type: 'poster',
    size: 'small',
    source: 'myanimelist',
  })

  return {
    malId: anime.malId,
    title: anime.title,
    imageUrl,
    smallImageUrl,
    score: anime.score,
    type: anime.type || 'Unknown',
    status: anime.status || 'Unknown',
    year: anime.year ?? 0,
    altImageText: `Image for ${anime.title}`,
  }
}

/**
 * Maps a collection of anime rows into card payloads.
 *
 * @param input - Anime rows for one list page
 * @returns {@link AnimeCard}[] in repository order
 *
 * @see {@link animeListService}
 */
export const mapAnimeListToCards = ({
  animeList,
}: MapAnimeListToCardsInput): AnimeCard[] => {
  return animeList.map((anime) => mapAnimeCard({ anime }))
}
