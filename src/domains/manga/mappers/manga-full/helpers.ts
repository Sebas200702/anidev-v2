/**
 * Helpers of the extended printed-media mapper.
 *
 * @module domains/manga/mappers/manga-full/helpers
 */
import { config } from '@/config'
import type { MangaDB, MangaFullDetails } from '@manga/types'

type MangaTitle = MangaFullDetails['titles'][number]
type MangaRelationGroup = MangaFullDetails['relations'][number]

/**
 * Collects every title of a work: main, english, japanese and synonyms.
 *
 * @param work - Work row
 * @param synonyms - Alternative titles
 * @returns Titles in display order, empty ones omitted
 */
export const buildMangaTitles = (
  work: MangaDB,
  synonyms: string[]
): MangaTitle[] => {
  const titles: MangaTitle[] = [{ title: work.title, type: 'main' }]
  if (work.titleEnglish)
    titles.push({ title: work.titleEnglish, type: 'english' })
  if (work.titleJapanese)
    titles.push({ title: work.titleJapanese, type: 'japanese' })
  for (const title of synonyms) titles.push({ title, type: 'synonym' })
  return titles
}

/**
 * Groups related works by relation type (`Adaptation`, `Sequel`, …).
 *
 * @param related - Related works with their relation type
 * @returns One group per relation type, in first-seen order
 */
export const groupMangaRelations = (
  related: { relatedMangaId: number; title: string; relationType: string }[]
): MangaRelationGroup[] =>
  [...Map.groupBy(related, (r) => r.relationType)].map(
    ([relation, entries]) => ({
      relation,
      entry: entries.map(({ relatedMangaId, title }) => ({
        mangaId: relatedMangaId,
        title,
        url: `${config.baseUrl}/manga/${relatedMangaId}`,
      })),
    })
  )
