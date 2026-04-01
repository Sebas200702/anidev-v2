import { config } from '@/config'
import type { AnimeCard } from '@/domains/anime/types/anime-card'
import type { AnimeDB, AnimeMediaDB } from '@/domains/anime/types/anime-db'

export const mapAnimeCard = ({
  anime,
  animeMedia,
}: {
  anime: AnimeDB
  animeMedia: AnimeMediaDB[]
}): AnimeCard => {
  return {
    malId: anime.malId,
    title: anime.title,
    imageUrl:
      animeMedia.find((m) => m.mediaType === 'poster' && m.size === 'large')
        ?.src ||
      animeMedia.find((m) => m.mediaType === 'poster' && m.size === 'default')
        ?.src ||
      `${config.baseUrl}/placeholder.webp`,
    smallImageUrl:
      animeMedia.find((m) => m.mediaType === 'poster' && m.size === 'small')
        ?.src ||
      animeMedia.find((m) => m.mediaType === 'poster' && m.size === 'default')
        ?.src ||
      `${config.baseUrl}/placeholder.webp`,
    score: anime.score,
    type: anime.type || 'Unknown',
    status: anime.status || 'Unknown',
    year: anime.year ?? 0,
    altImageText: `Image for ${anime.title}`,
  }
}
