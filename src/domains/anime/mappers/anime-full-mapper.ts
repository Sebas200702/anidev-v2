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
  AnimeTitle,
  AnimeTitleSynonymDB,
  DemographicDB,
  GenreDB,
  ThemeDB,
} from '@domains/anime/types'
import type { MusicDB } from '@domains/music/types'
import { mapMusicListToAnimeMusic } from '@domains/anime/mappers/anime-music-mapper'
import { mapExternalIds } from '@domains/anime/mappers/anime-external-mapper'
import { config } from '@/config'
import { buildMediaUrl } from '@domains/media/mappers/media-url-mapper'
import { detectMediaSource } from '@domains/media/mappers/media-assets-mapper'
import type { MediaAsset } from '@domains/media/types/media-types'

/** Grouped relation entry used while building full detail payloads. */
type RelationGroupEntry = {
  relatedId: number
  title: string
  url: string
}

/** Grouped relation bucket keyed by relation type. */
type RelationGroup = {
  relation: string
  entry: RelationGroupEntry[]
}

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
 * **Titles:** Main + synonyms + optional English/Japanese from anime row.
 *
 * **Relations:** Grouped by `relationType`; related titles resolved from
 * `relationData` (empty string if related anime row missing).
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
  const titles: AnimeTitle[] = [
    {
      title: anime.title,
      type: 'main',
    },
    ...titleSynonyms.map((syn) => ({
      title: syn.title,
      type: 'synonym' as const,
    })),
  ]
  if (anime.titleEnglish) {
    titles.push({
      title: anime.titleEnglish,
      type: 'english' as const,
    })
  }
  if (anime.titleJapanese) {
    titles.push({
      title: anime.titleJapanese,
      type: 'japanese' as const,
    })
  }

  const openings = mapMusicListToAnimeMusic(
    animeMusic.filter((m) => m.type === 'OP')
  )

  const endings = mapMusicListToAnimeMusic(
    animeMusic.filter((m) => m.type === 'ED')
  )

  const relationsGrouped = Object.values(
    relations.reduce<Record<string, RelationGroup>>((acc, rel) => {
      const key = rel.relationType
      if (!acc[key]) {
        acc[key] = { relation: key, entry: [] }
      }
      acc[key].entry.push({
        relatedId: rel.relatedAnimeId,
        title:
          relationData.find((a) => a.malId === rel.relatedAnimeId)?.title ?? '',
        url: `${config.baseUrl}/anime/${rel.relatedAnimeId}`,
      })
      return acc
    }, {})
  )

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
