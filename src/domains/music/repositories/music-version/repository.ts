/**
 * @module domains/music/repositories/music-version/repository
 * @remarks Database access for music version and resolution records. Versions represent
 * alternate cuts of a track; resolutions hold playable audio/video URLs per version.
 */
import { db } from '@db/client'
import { musicResolution, musicVersion } from '@db/schemas/music'
import type {
  MusicResolutionDB,
  MusicVersionDB,
} from '@music/types/music-db-types'
import { eq, inArray } from 'drizzle-orm'
import { dbError } from '@shared/errors/db-errors'

/**
 * Reads music version and resolution rows.
 *
 * @remarks Database failures are wrapped in {@link dbError} so an unavailable
 * database surfaces as a typed {@link InfraError} instead of a raw driver error.
 * @see {@link musicService.getMusicDetailsById} for resolution batching by version ID
 * @example
 * ```typescript
 * const versions = await musicVersionRepository.findVersionsByMusicId(42)
 * const resolutions = await musicVersionRepository.findResolutionsByVersionId(7)
 * ```
 */
export const musicVersionRepository = {
  /**
   * Loads all versions for a music record.
   *
   * @param musicId - Internal music identifier
   * @returns {@link MusicVersionDB} rows for the music entry
   * @throws {InfraError} On database failure (`[FIND_VERSIONS_BY_MUSIC_ID]`)
   * @see {@link musicVersionRepository.findResolutionsByVersionId} for nested resolutions
   * @example
   * ```typescript
   * const versions = await musicVersionRepository.findVersionsByMusicId(42)
   * ```
   */
  async findVersionsByMusicId(musicId: number): Promise<MusicVersionDB[]> {
    try {
      const rows = await db
        .select()
        .from(musicVersion)
        .where(eq(musicVersion.musicId, musicId))
      return rows
    } catch (error) {
      throw dbError('[FIND_VERSIONS_BY_MUSIC_ID]', { musicId }, error)
    }
  },

  /**
   * Loads resolutions for a single version.
   *
   * @param versionId - Internal version identifier
   * @returns {@link MusicResolutionDB} rows containing audio/video URLs
   * @throws {InfraError} On database failure (`[FIND_RESOLUTIONS_BY_VERSION_ID]`)
   * @see {@link mapMusicDetail} for nesting resolutions under version entries
   * @example
   * ```typescript
   * const resolutions = await musicVersionRepository.findResolutionsByVersionId(7)
   * ```
   */
  async findResolutionsByVersionId(
    versionId: number
  ): Promise<MusicResolutionDB[]> {
    try {
      const rows = await db
        .select()
        .from(musicResolution)
        .where(eq(musicResolution.musicVersionId, versionId))
      return rows
    } catch (error) {
      throw dbError('[FIND_RESOLUTIONS_BY_VERSION_ID]', { versionId }, error)
    }
  },

  /**
   * Loads resolutions for multiple versions in one query.
   *
   * @remarks Short-circuits to an empty array when `versionIds` is empty.
   * @param versionIds - Internal version identifiers
   * @returns {@link MusicResolutionDB} rows for the requested versions
   * @throws {InfraError} On database failure (`[FIND_RESOLUTIONS_BY_VERSION_IDS]`)
   * @see {@link musicVersionRepository.findResolutionsByVersionId} for single-version lookup
   * @example
   * ```typescript
   * const resolutions = await musicVersionRepository.findResolutionsByVersionIds([1, 2])
   * ```
   */
  async findResolutionsByVersionIds(
    versionIds: number[]
  ): Promise<MusicResolutionDB[]> {
    if (versionIds.length === 0) return []

    try {
      const rows = await db
        .select()
        .from(musicResolution)
        .where(inArray(musicResolution.musicVersionId, versionIds))
      return rows
    } catch (error) {
      throw dbError(
        '[FIND_RESOLUTIONS_BY_VERSION_IDS]',
        { count: versionIds.length },
        error
      )
    }
  },
}
