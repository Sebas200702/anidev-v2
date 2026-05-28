import type {
  AnimeFullDetails,
  AnimeTitle,
  AnimeExternalIds,
} from '@/domains/anime/types/anime-full'
import type {
  AnimeDB,
  AnimeTitleSynonymDB,
  AnimeRelationsDB,
  DemographicDB,
  ThemeDB,
  GenreDB,
  AnimeExternalDB,
} from '@/domains/anime/types/anime-db'
import type { MusicDB } from '@/domains/music/types/music-db'
import { mapMusicListToAnimeMusic } from '@/domains/anime/mappers/anime-music'
import { mapExternalIds } from '@/domains/anime/mappers/anime-external'
import { config } from '@/config'
import type { MediaAsset } from '@/domains/media/types/media'

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
}: {
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
}): AnimeFullDetails {
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
    relations.reduce<
      Record<
        string,
        {
          relation: string
          entry: { relatedId: number; title: string; url: string }[]
        }
      >
    >((acc, rel) => {
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
      src: m.src,
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
