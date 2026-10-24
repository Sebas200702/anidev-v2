/**
 * Character use cases: search, profile and appearances.
 *
 * @module domains/people/services/character/service
 */
import { CacheTtl } from '@lib/cache/config'
import type { StaleResult } from '@lib/cache/cache-store-types'
import { peopleCacheKey, withPeopleCache } from '@people/cache/people-cache'
import { characterNotFound } from '@people/errors'
import {
  mapCharacterAppearance,
  mapCharacterCard,
  mapCharacterProfile,
} from '@people/mappers/character'
import { characterAppearancesRepository } from '@people/repositories/character-appearances'
import { characterProfileRepository } from '@people/repositories/character-profile'
import { characterSearchRepository } from '@people/repositories/character-search'
import type {
  CharacterAppearance,
  CharacterCard,
  CharacterProfile,
  PeoplePage,
  PeopleSearchQuery,
} from '@people/types'

type Page<T> = { list: T[]; total: number }

/** Coordinates the cached character reads. */
export const characterService = {
  /**
   * Searches characters by name, most favorited first.
   *
   * @param query - Validated `{ query, page, limit }`
   * @returns `{ value: { list, total }, isStale }`
   * @throws {InfraError} On database failure with no cached copy
   */
  search(query: PeopleSearchQuery): Promise<StaleResult<Page<CharacterCard>>> {
    return withPeopleCache(
      peopleCacheKey('character', 'search', query),
      CacheTtl.Medium,
      async () => {
        const [rows, total] = await Promise.all([
          characterSearchRepository.search(query),
          characterSearchRepository.count(query.query),
        ])
        return { list: rows.map(mapCharacterCard), total }
      }
    )
  },

  /**
   * Loads a character profile with its voice actors.
   *
   * @param malId - MyAnimeList character id
   * @returns `{ value, isStale }`
   * @throws {DomainError} `CHARACTER_NOT_FOUND` (missing or provisional)
   * @throws {InfraError} On database failure with no cached copy
   */
  getProfile(malId: number): Promise<StaleResult<CharacterProfile>> {
    return withPeopleCache(
      peopleCacheKey('character', 'profile', malId),
      CacheTtl.Long,
      async () => {
        const row = await characterProfileRepository.getCharacter(malId)
        if (!row) throw characterNotFound(malId)
        const voices = await characterProfileRepository.getVoiceActors(malId)
        return mapCharacterProfile(row, voices)
      }
    )
  },

  /**
   * Lists the works where a character appears.
   *
   * @param malId - MyAnimeList character id
   * @param page - Pagination
   * @returns `{ value: { list, total }, isStale }`
   * @throws {DomainError} `CHARACTER_NOT_FOUND`
   * @throws {InfraError} On database failure with no cached copy
   */
  async getAppearances(
    malId: number,
    page: PeoplePage
  ): Promise<StaleResult<Page<CharacterAppearance>>> {
    await characterService.getProfile(malId)
    return withPeopleCache(
      peopleCacheKey('character', 'appearances', { malId, ...page }),
      CacheTtl.Medium,
      async () => {
        const [rows, total] = await Promise.all([
          characterAppearancesRepository.getAppearances(malId, page),
          characterAppearancesRepository.count(malId),
        ])
        return { list: rows.map(mapCharacterAppearance), total }
      }
    )
  },
}
