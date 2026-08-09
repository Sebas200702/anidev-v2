/**
 * @module domains/music/services/anime-music/service
 * @remarks Public read exposing an anime's linked music so other domains consume the music
 * domain through its service surface instead of importing {@link animeMusicRepository} directly.
 * Cache-first via {@link withStaleCache}: on infra failure serves the last-known-good snapshot
 * tagged stale instead of throwing.
 */
import { animeMusicRepository } from '@music/repositories/anime-music'
import type { MusicDB } from '@music/types/music-db-types'
import { animeMusicCache } from '@music/cache/anime-music-cache'
import { cacheGet, cacheSet, withStaleCache } from '@lib/cache'
import { CacheTtl } from '@lib/cache/config'
import type { StaleResult } from '@lib/cache/cache-store-types'

/**
 * Loads the music entries linked to an anime.
 *
 * @param animeId - Internal anime identifier (MAL ID in this schema)
 * @returns `{ value, isStale }` — Partial {@link MusicDB} rows linked to the
 * anime plus a stale flag when served from last-known-good data
 * @throws {InfraError} When the repository fails and no stale value exists
 * @see {@link animeMusicRepository.findMusicByAnimeId}
 * @example
 * ```typescript
 * const { value: tracks, isStale } = await getMusicByAnimeId(5114)
 * ```
 */
export const getMusicByAnimeId = async (
  animeId: number
): Promise<StaleResult<MusicDB[]>> =>
  withStaleCache({
    key: animeMusicCache.key(animeId),
    staleKey: `${animeMusicCache.key(animeId)}:stale`,
    getCache: () => animeMusicCache.get(animeId),
    getStaleCache: (key) => cacheGet<MusicDB[]>(key),
    setCache: (_, value) => animeMusicCache.set(animeId, value),
    setStaleCache: (key, value) =>
      cacheSet(key, value, { ttlSeconds: CacheTtl.Stale }),
    compute: () => animeMusicRepository.findMusicByAnimeId(animeId),
  })
