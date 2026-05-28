/**
 * @module @domains/music/repositories/music-repository
 * @remarks Database access for core music records stored in the `music` table.
 */
import type { MusicDB } from '@domains/music/types/music-db.d-types'
import { db } from '@db/client'
import { eq, inArray } from 'drizzle-orm'
import { dbError } from '@shared/errors/db-errors'
import { music } from '@db/schemas/music'

/**
 * Reads music rows from the music table.
 *
 * @remarks All methods wrap Drizzle queries and translate failures into {@link dbError}
 * payloads tagged with the calling operation name.
 * @see {@link musicService.getMusicDetailsById} for the primary consumer
 * @example
 * ```typescript
 * const row = await musicRepository.getMusicById(42)
 * const openings = await musicRepository.findByType('OP', 20)
 * ```
 */
export const musicRepository = {
  /**
   * Loads a music row by internal ID.
   *
   * @remarks Returns `undefined` when no row matches; callers must handle missing records.
   * @param id - Internal music identifier
   * @returns Matching {@link MusicDB} row, or `undefined` when not found
   * @throws {DbError} When the database query fails
   * @see {@link musicNotFound} for the domain error used when the row is missing
   * @example
   * ```typescript
   * const music = await musicRepository.getMusicById(42)
   * if (!music) throw musicNotFound(42)
   * ```
   */
  async getMusicById(id: number): Promise<MusicDB> {
    try {
      const [result] = await db.select().from(music).where(eq(music.id, id))
      return result
    } catch (error) {
      throw dbError('getMusicById', { id }, error)
    }
  },

  /**
   * Loads multiple music rows by ID list.
   *
   * @remarks Short-circuits to an empty array when `ids` is empty to avoid invalid SQL.
   * @param ids - Internal music identifiers
   * @returns Matching {@link MusicDB} rows, or an empty array when none requested
   * @throws {DbError} When the database query fails
   * @see {@link musicRepository.getMusicById} for single-row lookup
   * @example
   * ```typescript
   * const rows = await musicRepository.findManyByIds([1, 2, 3])
   * ```
   */
  async findManyByIds(ids: number[]): Promise<MusicDB[]> {
    try {
      if (ids.length === 0) return []

      return await db.select().from(music).where(inArray(music.id, ids))
    } catch (error) {
      throw dbError('findManyByIds', { ids }, error)
    }
  },

  /**
   * Loads music rows filtered by type.
   *
   * @remarks Common `type` values are `OP` (opening) and `ED` (ending).
   * @param type - Music type code such as `OP` or `ED`
   * @param limit - Maximum rows to return
   * @returns Matching {@link MusicDB} rows
   * @throws {DbError} When the database query fails
   * @see {@link mapMusicDetail} for type normalization into API labels
   * @example
   * ```typescript
   * const openings = await musicRepository.findByType('OP', 50)
   * ```
   */
  async findByType(type: string, limit = 50): Promise<MusicDB[]> {
    try {
      return db.select().from(music).where(eq(music.type, type)).limit(limit)
    } catch (error) {
      throw dbError('findByType', { type, limit }, error)
    }
  },
}
