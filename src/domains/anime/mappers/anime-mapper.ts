/**
 * Maps database rows into the primary anime detail page payload.
 *
 * @module domains/anime/mappers/anime-mapper
 */
import { config } from '@/config'
import { normalizeString } from '@utils/string/normalize-string-util'
import type {
  AnimeDB,
  AnimeDetails,
  DemographicDB,
  GenreDB,
  ThemeDB,
} from '@domains/anime/types'
import { buildMediaUrl } from '@domains/media/mappers/media-url-mapper'
import type { MediaAsset } from '@domains/media/types/media-types'

/**
 * Input for assembling an anime detail payload.
 *
 * @see {@link animeService.getAnimeDetails}
 */
type MapAnimeDetailsInput = {
  /** Genre rows from {@link animeTaxonomyRepository.getGenresByAnimeId} */
  genres: GenreDB[]
  /** Theme rows */
  themes: ThemeDB[]
  /** Demographic rows */
  demographics: DemographicDB[]
  /** Trailer/poster assets from media repository */
  media: MediaAsset[]
  /** Core `anime` row */
  anime: AnimeDB
}

/**
 * Maps anime, taxonomy, and media rows into an {@link AnimeDetails} payload.
 *
 * @param input - Source rows required for the detail page
 * @returns Public page DTO with CDN URLs, slug, and fallback copy
 *
 * @remarks
 * **Field transformations:**
 * - Poster/banner URLs via {@link buildMediaUrl} (`myanimelist` source)
 * - `genres` / `themes` / `demographics` → `string[]` of names only
 * - `year` defaults to `0`; `status` to `'Unknown'`
 * - `synopsis` fallback: `'No synopsis available.'`
 * - `trailerUrl` from first `mediaType === 'trailer'`, else site placeholder
 * - `slug` and canonical `url` / `watchUrl` via {@link normalizeString}
 *
 * @example
 * ```typescript
 * const details = mapAnimeDetails({ anime, genres, themes, demographics, media })
 * ```
 *
 * @see {@link animeDetailsSchema}
 */
export const mapAnimeDetails = ({
  genres,
  themes,
  demographics,
  media,
  anime,
}: MapAnimeDetailsInput): AnimeDetails => {
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
