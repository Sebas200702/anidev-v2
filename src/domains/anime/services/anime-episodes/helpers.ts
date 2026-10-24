/**
 * Helpers for the anime-episodes service.
 *
 * @module domains/anime/services/anime-episodes/helpers
 */
import { animeNotFound } from '@anime/errors'
import { animeRepository } from '@anime/repositories/anime'

/**
 * Throws `ANIME_NOT_FOUND` when no anime row exists for `malId`.
 *
 * @remarks
 * Called only on the empty paths (zero total, missing episode) so normal reads
 * pay no extra query (design D-E3).
 *
 * @throws {AnimeNotFoundError} When the anime row is missing
 * @throws {InfraError} On database failure
 */
export const assertAnimeExists = async (malId: number): Promise<void> => {
  const anime = await animeRepository.getAnimeByMalId(malId)
  if (!anime) throw animeNotFound(malId)
}
