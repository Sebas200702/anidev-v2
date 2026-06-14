/**
 * @module @domains/music/repositories/music-relation-repository
 * @remarks Database access for music-to-artist relations via the `musicArtist` join table.
 */
import { db } from '@db/client'
import { artist } from '@db/schemas/artist'
import { musicArtist } from '@db/schemas/music-relations'
import type { MusicArtistDB } from '@domains/music/types/music-db-types'
import { eq, inArray } from 'drizzle-orm'

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
   * @throws May propagate underlying database driver errors
   * @see {@link MusicDetails.artist} for the serialized output field
   * @example
   * ```typescript
   * const artists = await musicRelationRepository.findArtistsByMusicId(42)
   * console.log(artists.map((a) => a.name))
   * ```
   */
  async findArtistsByMusicId(musicId: number): Promise<MusicArtistDB[]> {
    const rows = await db
      .select({
        id: musicArtist.artistId,
        name: artist.name,
        malId: artist.malId,
      })
      .from(musicArtist)
      .innerJoin(artist, eq(musicArtist.artistId, artist.id))
      .where(eq(musicArtist.musicId, musicId))

    return rows
  },

  /**
   * Loads artists linked to multiple music records in one query.
   *
   * @param musicIds - Internal music identifiers
   * @returns {@link MusicArtistDB} rows with `musicId` for grouping in list mappers
   * @remarks Short-circuits to an empty array when `musicIds` is empty.
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

    const rows = await db
      .select({
        id: musicArtist.artistId,
        name: artist.name,
        malId: artist.malId,
        musicId: musicArtist.musicId,
      })
      .from(musicArtist)
      .innerJoin(artist, eq(musicArtist.artistId, artist.id))
      .where(inArray(musicArtist.musicId, musicIds))

    return rows
  },
}
