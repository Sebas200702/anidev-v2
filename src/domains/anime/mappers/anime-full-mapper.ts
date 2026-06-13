/**
 * Maps database rows into the full anime detail API payload.
 *
 * @module domains/anime/mappers/anime-full-mapper
 */
import type {
  AnimeDB,
  AnimeExternalDB,
  AnimeExternalIds,
  AnimeFullDetails,
  AnimeRelationsDB,
  AnimeTitleSynonymDB,
  DemographicDB,
  GenreDB,
  ThemeDB,
} from '@domains/anime/types'
import type { MusicDB } from '@domains/music/types/music-db.d-types'
import { mapMusicListToAnimeMusic } from '@domains/anime/mappers/anime-music-mapper'
import { mapExternalIds } from '@domains/anime/mappers/anime-external-mapper'
import {
  buildAnimeTitles,
  groupAnimeRelations,
} from '@domains/anime/mappers/anime-full-mapper-helpers'
import type { MediaAsset } from '@domains/media/types/media-types'

/**
 * Input for assembling a full anime detail payload.
 *
 * @see {@link animeFullService.getAnimeFullByMalId}
 */
type MapAnimeToFullDetailsInput = {
  anime: AnimeDB
  genres: GenreDB[]
  themes: ThemeDB[]
  demographics: DemographicDB[]
  media: MediaAsset[]
  titleSynonyms: AnimeTitleSynonymDB[]
  relations: AnimeRelationsDB[]
  relationData: AnimeDB[]
  externalIds: AnimeExternalDB
  animeMusic: MusicDB[]
}

/**
 * Maps aggregated anime data into an {@link AnimeFullDetails} payload.
 *
 * @param input - Source rows required for the full detail endpoint
 * @returns Expanded DTO with titled variants, grouped relations, OP/ED music, external IDs
 *
 * @remarks
 * **Titles:** Main + synonyms + optional English/Japanese from anime row (see
 * {@link buildAnimeTitles}).
 *
 * **Relations:** Grouped by `relationType` via {@link groupAnimeRelations}; related titles
 * resolved from `relationData` (empty string if related anime row missing).
 *
 * **Music:** Filtered `OP` / `ED` from {@link MusicDB} via {@link mapMusicListToAnimeMusic}.
 *
 * **Defaults:** `year`, `score`, `episodes`, etc. use `??` fallbacks; `rating` /
 * `season` / `status` / `type` → `'Unknown'` when null.
 *
 * @see {@link animeFullDetailsSchema}
 */
export function mapAnimeToFullDetails({
  anime,
  genres,
  themes,
  demographics,
  media,
  titleSynonyms,
  relations,
  relationData,
  externalIds,
  animeMusic,
}: MapAnimeToFullDetailsInput): AnimeFullDetails {
  const titles = buildAnimeTitles(anime, titleSynonyms)

  const openings = mapMusicListToAnimeMusic(
    animeMusic.filter((m) => m.type === 'OP')
  )

  const endings = mapMusicListToAnimeMusic(
    animeMusic.filter((m) => m.type === 'ED')
  )

  const relationsGrouped = groupAnimeRelations(relations, relationData)

  const mediaGroups = new Map<string, MediaAsset[]>()
  for (const asset of media) {
    const key = `${asset.mediaType}:${asset.size ?? 'default'}`
    const group = mediaGroups.get(key)
    if (group) {
      group.push(asset)
    } else {
      mediaGroups.set(key, [asset])
    }
  }

  const assetIndices = new Map<number, number>()
  for (const [, group] of mediaGroups) {
    group.forEach((asset, idx) => {
      assetIndices.set(asset.id, idx + 1)
    })
  }

  const external: AnimeExternalIds[] = mapExternalIds(externalIds)

  return {
    malId: anime.malId,
    title: anime.title,
    titles,
    year: anime.year ?? 0,
    score: anime.score ?? 0,
    scoredBy: anime.scoredBy ?? 0,
    popularityRank: anime.popularityRank ?? 0,
    rating: anime.rating ?? 'Unknown',
    season: anime.season ?? 'Unknown',
    background: anime.background ?? '',
    status: anime.status ?? 'Unknown',
    genres: genres.map((g) => ({ name: g.name, malId: g.malId })),
    themes: themes.map((t) => ({ name: t.name, malId: t.malId })),
    demographics: demographics.map((d) => ({ name: d.name, malId: d.malId })),
    synopsis: anime.synopsis ?? 'No synopsis available.',
    media: media.map((m) => ({
      mediaType: m.mediaType,
      src: buildMediaUrl({
        entity: 'anime',
        entity_id: anime.malId,
        type: m.mediaType,
        size: (m.size ?? 'default') as 'default' | 'small' | 'large',
        index: assetIndices.get(m.id) ?? 1,
        source: detectMediaSource(m.src),
      }),
      size: m.size ?? 'default',
    })),
    relations: relationsGrouped,
    type: anime.type ?? 'Unknown',
    episodes: anime.episodes ?? 0,
    music: {
      openings,
      endings,
    },
    externalIds: external,
  }
}
