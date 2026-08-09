/**
 * @module domains/music/repositories/music-relation/repository
 * @remarks Database access for music-to-artist relations via the `musicArtist` join table.
 */
import { db } from '@db/client'
import { artist } from '@db/schemas/artist'
import { musicArtist } from '@db/schemas/music-relations'
import type { MusicArtistDB } from '@music/types/music-db-types'
import { eq, inArray } from 'drizzle-orm'
import type { PgColumn } from 'drizzle-orm/pg-core'
import { dbError } from '@shared/errors/db-errors'

/**
 * Builds the shared `musicArtist` × `artist` join projection.
 *
 * @template TSelection - Shape of the selected columns; lets Drizzle preserve
 * row inference from whichever projection each lookup passes
 * @param selection - Columns to select from the joined tables; the single- and
 * multi-music lookups differ only in whether `musicId` is included
 * @returns A Drizzle query pinned to the `musicArtist` × `artist` inner join
 * @remarks Centralizes the join so both artist lookups stay in sync.
 */
const baseArtistQuery = <TSelection extends Record<string, PgColumn>>(
  selection: TSelection
) => {
  return db
    .select(selection)
    .from(musicArtist)
    .innerJoin(artist, eq(musicArtist.artistId, artist.id))
}

/**
 * Reads artist relations for music records.
 *
 * @remarks Joins `musicArtist` with `artist` to return display names and MAL IDs for
 * each credited performer on a track.
 * @see {@link mapMusicDetail} for mapping into the `artist` array on {@link MusicDetails}
 * @example
 * ```typescript
 * const artists = await musicRelationRepository.findArtistsByMusicId(42)
 * ```
 */
export const musicRelationRepository = {
  /**
   * Loads artists linked to a music record.
   *
   * @param musicId - Internal music identifier
   * @returns {@link MusicArtistDB} rows associated with the music entry
   * @throws {InfraError} On database failure (`[ARTISTS_BY_MUSIC_ID]`)
   * @see {@link MusicDetails.artist} for the serialized output field
   * @example
   * ```typescript
   * const artists = await musicRelationRepository.findArtistsByMusicId(42)
   * console.log(artists.map((a) => a.name))
   * ```
   */
  async findArtistsByMusicId(musicId: number): Promise<MusicArtistDB[]> {
    try {
      const rows = await baseArtistQuery({
        id: musicArtist.artistId,
        name: artist.name,
        malId: artist.malId,
      }).where(eq(musicArtist.musicId, musicId))

      return rows
    } catch (error) {
      throw dbError('[ARTISTS_BY_MUSIC_ID]', { musicId }, error)
    }
  },

  /**
   * Loads artists linked to multiple music records in one query.
   *
   * @returns {@link MusicArtistDB} rows with `musicId` for grouping in list mappers
   * @remarks Short-circuits to an empty array when `musicIds` is empty.
   * @throws {InfraError} On database failure (`[ARTISTS_BY_MUSIC_IDS]`)
   * @see {@link musicListService.getMusicList} for batch usage
   * @example
   * ```typescript
   * const artists = await musicRelationRepository.findArtistsByMusicIds([1, 2, 3])
   * ```
   */
  async findArtistsByMusicIds(
    musicIds: number[]
  ): Promise<Array<MusicArtistDB & { musicId: number }>> {
    if (musicIds.length === 0) return []

    try {
      const rows = await baseArtistQuery({
        id: musicArtist.artistId,
        name: artist.name,
        malId: artist.malId,
        musicId: musicArtist.musicId,
      }).where(inArray(musicArtist.musicId, musicIds))

      return rows
    } catch (error) {
      throw dbError('[ARTISTS_BY_MUSIC_IDS]', { musicIds }, error)
    }
  },
}
