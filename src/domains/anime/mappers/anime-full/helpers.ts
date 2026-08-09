/**
 * Helpers for assembling full anime detail payloads.
 *
 * @module domains/anime/mappers/anime-full/helpers
 * @remarks
 * Pure builders extracted from {@link mapAnimeToFullDetails}: title list assembly and relation
 * grouping by relation type.
 */
import type {
  AnimeDB,
  AnimeRelationsDB,
  AnimeTitle,
  AnimeTitleSynonymDB,
} from '@anime/types'
import { config } from '@/config'
import type { RelationGroup } from './helpers.types'

export type { RelationGroup } from './helpers.types'

/**
 * Builds the ordered title list: main, synonyms, then optional English/Japanese.
 *
 * @param anime - Source anime row
 * @param titleSynonyms - Synonym rows for the anime
 * @returns Ordered {@link AnimeTitle} list
 */
export const buildAnimeTitles = (
  anime: AnimeDB,
  titleSynonyms: AnimeTitleSynonymDB[]
): AnimeTitle[] => {
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
export const groupAnimeRelations = (
  relations: AnimeRelationsDB[],
  relationData: AnimeDB[]
): RelationGroup[] => {
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
