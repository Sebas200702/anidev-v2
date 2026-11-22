/**
 * Maps database rows into the full anime detail API payload.
 *
 * @module domains/anime/mappers/anime-full/mapper
 */
import type { AnimeExternalIds, AnimeFullDetails } from '@anime/types'
import { mapMusicListToAnimeMusic } from '@anime/mappers/anime-music'
import { mapExternalIds } from '@anime/mappers/anime-external'
import { mapAnimeMediaItems } from '@anime/mappers/anime-media'
import { buildAnimeTitles, groupAnimeRelations } from './helpers'
import type { MapAnimeToFullDetailsInput } from './types'

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
 * **Media:** Proxy URLs come from {@link mapAnimeMediaItems}, so each index is
 * counted inside the same (type, normalized size, source) group the `/media`
 * resolver uses and every URL serves the asset it was built from.
 *
 * **Music:** Filtered `OP` / `ED` from {@link MusicDB} via {@link mapMusicListToAnimeMusic}.
 *
 * **Defaults:** `year`, `score`, `episodes`, etc. use `??` fallbacks; `rating` /
 * `season` / `status` / `type` → `'Unknown'` when null.
 *
 * @see {@link animeFullDetailsSchema}
 */
export const mapAnimeToFullDetails = ({
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
  producers,
}: MapAnimeToFullDetailsInput): AnimeFullDetails => {
  const titles = buildAnimeTitles(anime, titleSynonyms)

  const openings = mapMusicListToAnimeMusic(
    animeMusic.filter((m) => m.type === 'OP')
  )

  const endings = mapMusicListToAnimeMusic(
    animeMusic.filter((m) => m.type === 'ED')
  )

  const relationsGrouped = groupAnimeRelations(relations, relationData)

  const mediaItems = mapAnimeMediaItems(anime.malId, media)

  const external: AnimeExternalIds[] = mapExternalIds(externalIds)

  return {
    malId: anime.malId,
    title: anime.title,
    titles,
    year: anime.year ?? 0,
    score: anime.score ?? 0,
    scoredBy: anime.scoredBy ?? 0,
    popularityRank: anime.popularityRank ?? 0,
    members: anime.members ?? 0,
    favorites: anime.favorites ?? 0,
    rating: anime.rating ?? 'Unknown',
    season: anime.season ?? 'Unknown',
    background: anime.background ?? '',
    status: anime.status ?? 'Unknown',
    producers: producers.map((p) => ({ name: p.name, role: p.role })),
    genres: genres.map((g) => ({ name: g.name, malId: g.malId })),
    themes: themes.map((t) => ({ name: t.name, malId: t.malId })),
    demographics: demographics.map((d) => ({ name: d.name, malId: d.malId })),
    synopsis: anime.synopsis ?? 'No synopsis available.',
    media: media.map((m, position) => ({
      mediaType: m.mediaType,
      src: mediaItems[position].url,
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
