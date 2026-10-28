/**
 * Shared loading and caching of the rows behind the printed-media detail
 * payloads (`/api/manga/:malId` and `/full`).
 *
 * @module domains/manga/services/manga-detail-rows/service
 */
import { cacheGet, cacheSet, withStaleCache } from '@lib/cache'
import { CacheTtl } from '@lib/cache/config'
import type { StaleResult } from '@lib/cache/cache-store-types'
import { mangaNotFound } from '@manga/errors/manga-not-found-error'
import type { MapMangaFullInput } from '@manga/mappers/manga-full'
import { mangaCastRepository } from '@manga/repositories/manga-cast'
import { mangaDetailsRepository } from '@manga/repositories/manga-details'
import { mangaTaxonomyRepository } from '@manga/repositories/manga-taxonomy'
import { mangaTitlesRepository } from '@manga/repositories/manga-titles'

/**
 * Loads every row a detail payload needs, in parallel.
 *
 * @param mangaId - MyAnimeList id of the work
 * @returns The rows for {@link mapMangaToFullDetails} (a superset of the
 *   detail mapper input)
 * @throws {DomainError} `MANGA_NOT_FOUND` when the work does not exist
 * @throws {InfraError} On database failure
 */
export const loadMangaDetailRows = async (
  mangaId: number
): Promise<MapMangaFullInput> => {
  const work = await mangaDetailsRepository.getManga(mangaId)
  if (!work) throw mangaNotFound(mangaId)

  const [
    genres,
    themes,
    demographics,
    characters,
    staff,
    publishers,
    related,
    externalLinks,
    synonyms,
  ] = await Promise.all([
    mangaTaxonomyRepository.getGenres(mangaId),
    mangaTaxonomyRepository.getThemes(mangaId),
    mangaTaxonomyRepository.getDemographics(mangaId),
    mangaCastRepository.getCharacters(mangaId),
    mangaDetailsRepository.getStaff(mangaId),
    mangaDetailsRepository.getPublishers(mangaId),
    mangaDetailsRepository.getRelated(mangaId),
    mangaDetailsRepository.getExternalLinks(mangaId),
    mangaTitlesRepository.getSynonyms(mangaId),
  ])
  const voiceActors = await mangaCastRepository.getVoiceActors(
    characters.map(({ characterId }) => characterId)
  )

  return {
    work,
    genres,
    themes,
    demographics,
    characters,
    voiceActors,
    staff,
    publishers,
    related,
    externalLinks,
    synonyms,
  }
}

/**
 * Serves a detail payload through the stale-while-error cache.
 *
 * @param key - Fresh cache key (the stale copy uses `${key}:stale`)
 * @param compute - Builds the payload on a cache miss
 * @returns `{ value, isStale }`
 */
export const withMangaDetailCache = <T>(
  key: string,
  compute: () => Promise<T>
): Promise<StaleResult<T>> =>
  withStaleCache({
    key,
    staleKey: `${key}:stale`,
    getCache: () => cacheGet<T>(key),
    getStaleCache: (staleKey) => cacheGet<T>(staleKey),
    setCache: (_, value) =>
      cacheSet(key, value, { ttlSeconds: CacheTtl.Medium }),
    setStaleCache: (staleKey, value) =>
      cacheSet(staleKey, value, { ttlSeconds: CacheTtl.Stale }),
    compute,
  })
