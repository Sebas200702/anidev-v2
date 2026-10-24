/**
 * Person use cases: search, profile, voices, staff credits and music.
 *
 * @module domains/people/services/person/service
 */
import { CacheTtl } from '@lib/cache/config'
import type { StaleResult } from '@lib/cache/cache-store-types'
import { musicListService } from '@music/services/music-list'
import { peopleCacheKey, withPeopleCache } from '@people/cache/people-cache'
import { personNotFound } from '@people/errors'
import {
  mapPersonCard,
  mapPersonCredit,
  mapPersonProfile,
  mapPersonVoice,
} from '@people/mappers/person'
import { personCreditsRepository } from '@people/repositories/person-credits'
import { personProfileRepository } from '@people/repositories/person-profile'
import { personSearchRepository } from '@people/repositories/person-search'
import { personVoicesRepository } from '@people/repositories/person-voices'
import type {
  PeopleMedium,
  PeoplePage,
  PeopleSearchQuery,
  PersonCard,
  PersonCredit,
  PersonProfile,
  PersonVoice,
} from '@people/types'

type Page<T> = { list: T[]; total: number }

/** Caches a paginated list for an hour under a `person` key. */
const cachedPage = <T>(
  view: string,
  args: unknown,
  compute: () => Promise<Page<T>>
) =>
  withPeopleCache(
    peopleCacheKey('person', view, args),
    CacheTtl.Medium,
    compute
  )

/** Coordinates the cached person reads. */
export const personService = {
  /** Searches people by name, most favorited first. */
  search(query: PeopleSearchQuery): Promise<StaleResult<Page<PersonCard>>> {
    return cachedPage('search', query, async () => {
      const [rows, total] = await Promise.all([
        personSearchRepository.search(query),
        personSearchRepository.count(query.query),
      ])
      return { list: rows.map(mapPersonCard), total }
    })
  },

  /**
   * Loads a person profile with its credit counts.
   *
   * @param malId - MyAnimeList person id
   * @returns `{ value, isStale }`
   * @throws {DomainError} `PERSON_NOT_FOUND`
   * @throws {InfraError} On database failure with no cached copy
   */
  getProfile(malId: number): Promise<StaleResult<PersonProfile>> {
    return withPeopleCache(
      peopleCacheKey('person', 'profile', malId),
      CacheTtl.Long,
      async () => {
        const row = await personProfileRepository.getPerson(malId)
        if (!row) throw personNotFound(malId)
        return mapPersonProfile(
          row,
          await personProfileRepository.getCounts(malId)
        )
      }
    )
  },

  /** Lists the characters a person voices (optionally one language). */
  async getVoices(
    malId: number,
    options: PeoplePage & { language?: string }
  ): Promise<StaleResult<Page<PersonVoice>>> {
    await personService.getProfile(malId)
    return cachedPage('voices', { malId, ...options }, async () => {
      const [rows, total] = await Promise.all([
        personVoicesRepository.getVoices(malId, options),
        personVoicesRepository.count(malId, options.language),
      ])
      return { list: rows.map(mapPersonVoice), total }
    })
  },

  /** Lists the works a person is credited on, one medium at a time. */
  async getCredits(
    malId: number,
    options: PeoplePage & { medium: PeopleMedium }
  ): Promise<StaleResult<Page<PersonCredit>>> {
    await personService.getProfile(malId)
    return cachedPage('credits', { malId, ...options }, async () => {
      const [rows, total] = await Promise.all([
        personCreditsRepository.getCredits(malId, options),
        personCreditsRepository.count(malId, options.medium),
      ])
      return { list: rows.map(mapPersonCredit), total }
    })
  },

  /**
   * Lists the OP/ED themes performed by the person, through the music
   * artists linked by MAL id. Empty when the person is not an artist.
   */
  async getMusic(malId: number, page: PeoplePage) {
    await personService.getProfile(malId)
    const artistIds = await personCreditsRepository.getArtistIds(malId)
    return musicListService.getMusicList(page, { artistIds })
  },
}
