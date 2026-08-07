/**
 * @module @music/mappers/music-card-mapper-types
 * @remarks Input shapes for mapping database music rows into card payloads via
 * the music card mapper.
 */
import type { MusicArtistDB, MusicDB } from '@music/types/music-db-types'

/** Input for mapping a single music row to a card. */
export interface MapMusicCardInput {
  music: MusicDB
  artists: MusicArtistDB[]
}

/** Input for mapping multiple music rows to cards. */
export interface MapMusicListToCardsInput {
  musicList: MusicDB[]
  artistsByMusicId: Record<number, MusicArtistDB[]>
}
