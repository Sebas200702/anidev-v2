/**
 * Cache helpers for anime character list payloads.
 *
 * @module domains/anime/cache/anime-character-cache
 * @remarks
 * Read-through cache for {@link AnimeCharacter} arrays from
 * {@link animeCharacterService.getAnimeCharacters}.
 *
 * **Key format:** `anime:characters:{malId}`
 *
 * **TTL:** `CacheTtl.Long` (86400 s) — cast/voice credits change rarely;
 * longer TTL reduces join queries across `anime_character`, `character`, and
 * `character_voice_actor`.
 *
 * **Null vs miss:** `null` from `get` triggers recompute; empty arrays `[]` may
 * be cached when an anime has no characters.
 *
 * @see {@link animeCharacterService}
 * @see {@link mapAnimeCharacters}
 */
import { cacheGet, cacheSet } from '@lib/cache'
import type { AnimeCharacter } from '@domains/anime/types'
import { CacheKeyPrefix, CacheTtl } from '@lib/cache/config'

/**
 * Read-through cache for anime character collections keyed by MAL ID.
 */
export const animeCharacterCache = {
  /**
   * Builds the Redis cache key for an anime character list.
   *
   * @param malId - MyAnimeList identifier of the parent anime
   * @returns `anime:characters:{malId}`
   *
   * @example
   * ```typescript
   * animeCharacterCache.key(1) // 'anime:characters:1'
   * ```
   */
  key(malId: number) {
    return `${CacheKeyPrefix.AnimeCharacters}:${malId}`
  },

  /**
   * Retrieves cached anime characters.
   *
   * @param malId - Parent anime MAL ID
   * @returns `AnimeCharacter[]` on hit, `null` on miss
   */
  async get(malId: number): Promise<AnimeCharacter[] | null> {
    return cacheGet<AnimeCharacter[]>(this.key(malId))
  },

  /**
   * Stores a character list in Redis.
   *
   * @param malId - Parent anime MAL ID
   * @param value - Mapped character array (may be empty)
   */
  async set(malId: number, value: AnimeCharacter[]): Promise<void> {
    return cacheSet(this.key(malId), value, {
      ttlSeconds: CacheTtl.Long,
    })
  },
}
