import type {
  GenreDB,
  ThemeDB,
  DemographicDB,
  AnimeMediaDB,
  AnimeDB,
} from '@/domains/anime/types/anime-db'
import type { AnimeDetails } from '@/domains/anime/types/anime-details'
import { normalizeString } from '@/core/utils/string/normalize'
import { config } from '@/config'
export const mapAnimeDetails = ({
  genres,
  themes,
  demographics,
  media,
  anime,
}: {
  genres: GenreDB[]
  themes: ThemeDB[]
  demographics: DemographicDB[]
  media: AnimeMediaDB[]
  anime: AnimeDB
}): AnimeDetails => {
  return {
    malId: anime.malId,
    title: anime.title,
    year: anime.year || 0,
    status: anime.status || 'Unknown',
    genres: genres.map((g) => g.name),
    themes: themes.map((t) => t.name),
    demographics: demographics.map((d) => d.name),
    imageUrl:
      media.find((m) => m.mediaType === 'poster' && m.size === 'large')?.src ||
      media.find((m) => m.mediaType === 'poster' && m.size === 'default')
        ?.src ||
      `${config.baseUrl}/placeholder.webp`,

    smallImageUrl:
      media.find((m) => m.mediaType === 'poster' && m.size === 'small')?.src ||
      media.find((m) => m.mediaType === 'poster' && m.size === 'default')
        ?.src ||
      `${config.baseUrl}/placeholder.webp`,
    bannerImageUrl:
      media.find((m) => m.mediaType === 'banner')?.src ||
      media.find((m) => m.mediaType === 'poster' && m.size === 'large')?.src ||
      `${config.baseUrl}/placeholder.webp`,
    synopsis: anime.synopsis || 'No synopsis available.',
    trailerUrl:
      media.find((m) => m.mediaType === 'trailer')?.src ||
      `${config.baseUrl}/placeholder.webp`,
    slug: normalizeString({
      string: anime.title,
      separator: '-',
      toLowerCase: true,
    }),

    url: `${config.baseUrl}/anime/${anime.malId}/${normalizeString({
      string: anime.title,
      separator: '-',
      toLowerCase: true,
    })}`,
    shareText: `Check out ${anime.title} on AniDev!`,
    watchUrl: `${config.baseUrl}/anime/${anime.malId}/watch`,
    altImageText: `Image for ${anime.title}`,
  }
}
