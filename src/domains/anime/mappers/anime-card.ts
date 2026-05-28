import type { AnimeCard } from '@/domains/anime/types/anime-card'
import type { AnimeDB } from '@/domains/anime/types/anime-db'
import { buildMediaUrl } from '@/domains/media/mappers/media-url'

export const mapAnimeCard = ({ anime }: { anime: AnimeDB }): AnimeCard => {
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

export const mapAnimeListToCards = ({ animeList }: { animeList: AnimeDB[] }): AnimeCard[] => {
  return animeList.map((anime) => mapAnimeCard({ anime }))
}
