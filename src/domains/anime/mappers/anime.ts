import { config } from '@/config'
import { normalizeString } from '@/core/utils/string/normalize'
import type {
  AnimeDB,
  DemographicDB,
  GenreDB,
  ThemeDB,
} from '@/domains/anime/types/anime-db'
import type { AnimeDetails } from '@/domains/anime/types/anime-details'
import { buildMediaUrl } from '@/domains/media/mappers/media-url'
import type { MediaAsset } from '@/domains/media/types/media'
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
  media: MediaAsset[]
  anime: AnimeDB
}): AnimeDetails => {
  const imageUrl = buildMediaUrl({
    entity: 'anime',
    type: 'poster',
    size: 'large',
    entity_id: anime.malId,
    source: 'myanimelist',
  })
  const smallImageUrl = buildMediaUrl({
    entity: 'anime',
    type: 'poster',
    size: 'small',
    entity_id: anime.malId,
    source: 'myanimelist',
  })
  const bannerImageUrl = buildMediaUrl({
    entity: 'anime',
    type: 'banner',
    entity_id: anime.malId,
  })
  return {
    malId: anime.malId,
    title: anime.title,
    year: anime.year || 0,
    status: anime.status || 'Unknown',
    genres: genres.map((g) => g.name),
    themes: themes.map((t) => t.name),
    demographics: demographics.map((d) => d.name),
    imageUrl,
    smallImageUrl,
    bannerImageUrl,

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
