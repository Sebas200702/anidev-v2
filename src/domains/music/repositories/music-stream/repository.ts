/**
 * @module domains/music/repositories/music-stream/repository
 * @remarks Database access for the store links of a music track (`music_stream`).
 */
import { db } from '@db/client'
import { musicStream } from '@db/schemas/music-stream'
import type { MusicStreamDB } from '@music/types/music-db-types'
import { eq } from 'drizzle-orm'
import { dbError } from '@shared/errors/db-errors'

/**
 * Reads the store links linked to a music record.
 *
 * @remarks MAL publishes, for every opening/ending, the links to the licensed
 * streaming stores (Spotify, Apple Music, Amazon Music) with the track id inside
 * each store. Those links are what the catalog exposes when a track has no
 * playable file of its own.
 * @see {@link mapMusicDetail} for mapping into the `streams` array of {@link MusicDetails}
 * @example
 * ```typescript
 * const streams = await musicStreamRepository.findStreamsByMusicId(42)
 * console.log(streams.map((s) => s.provider))
 * ```
 */
export const musicStreamRepository = {
  /**
   * Loads the store links of a music record.
   *
   * @param musicId - Internal music identifier
   * @returns {@link MusicStreamDB} rows associated with the music entry
   * @throws {InfraError} On database failure (`[STREAMS_BY_MUSIC_ID]`)
   * @see {@link MusicDetails.streams} for the serialized output field
   * @example
   * ```typescript
   * const streams = await musicStreamRepository.findStreamsByMusicId(42)
   * ```
   */
  async findStreamsByMusicId(musicId: number): Promise<MusicStreamDB[]> {
    try {
      const rows = await db
        .select({
          id: musicStream.id,
          musicId: musicStream.musicId,
          provider: musicStream.provider,
          url: musicStream.url,
          externalId: musicStream.externalId,
          country: musicStream.country,
        })
        .from(musicStream)
        .where(eq(musicStream.musicId, musicId))

      return rows
    } catch (error) {
      throw dbError('[STREAMS_BY_MUSIC_ID]', { musicId }, error)
    }
  },
}
