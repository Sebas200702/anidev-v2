/**
 * Helpers for assembling full anime detail payloads.
 *
 * @module domains/anime/mappers/anime-full-mapper-helpers
 * @remarks
 * Pure builders extracted from {@link mapAnimeToFullDetails}: title list assembly and relation
 * grouping by relation type.
 */
import type {
  AnimeDB,
  AnimeRelationsDB,
  AnimeTitle,
  AnimeTitleSynonymDB,
} from '@domains/anime/types'
import { config } from '@/config'

/** Grouped relation entry used while building full detail payloads. */
type RelationGroupEntry = {
  relatedId: number
  title: string
  url: string
}

/** Grouped relation bucket keyed by relation type. */
export type RelationGroup = {
  relation: string
  entry: RelationGroupEntry[]
}

/**
 * Builds the ordered title list: main, synonyms, then optional English/Japanese.
 *
 * @param anime - Source anime row
 * @param titleSynonyms - Synonym rows for the anime
 * @returns Ordered {@link AnimeTitle} list
 */
export function buildAnimeTitles(
  anime: AnimeDB,
  titleSynonyms: AnimeTitleSynonymDB[]
): AnimeTitle[] {
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

  return titles
}

/**
 * Groups related anime by relation type, resolving related titles from `relationData`.
 *
 * @param relations - Relation join rows
 * @param relationData - Related anime rows used to resolve titles
 * @returns Relations grouped by `relationType`
 */
export function groupAnimeRelations(
  relations: AnimeRelationsDB[],
  relationData: AnimeDB[]
): RelationGroup[] {
  return Object.values(
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
}
