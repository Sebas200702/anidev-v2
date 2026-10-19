/**
 * @module @music/types/music-db-types
 * @remarks Drizzle-derived types for music database rows and relation projections used by
 * repositories and {@link mapMusicDetail}.
 */
import type { artist } from '@db/schemas/artist'
import type { music, musicResolution, musicVersion } from '@db/schemas/music'
import type { musicArtist } from '@db/schemas/music-relations'

/**
 * Selected music row shape from the `music` table.
 *
 * @remarks Source row for {@link mapMusicDetail}; includes `title` and `type` columns.
 * @see {@link musicRepository} for query methods
 * @example
 * ```typescript
 * const music: MusicDB = await musicRepository.getMusicById(42)
 * ```
 */
export type MusicDB = typeof music.$inferSelect

/**
 * Selected music resolution row shape from the `musicResolution` table.
 *
 * @remarks Contains playable `audioUrl`, `videoUrl`, and a `resolution` label linked to a
 * parent version via `musicVersionId`.
 * @see {@link musicVersionRepository.findResolutionsByVersionId} for loading resolutions
 * @example
 * ```typescript
 * const resolutions: MusicResolutionDB[] =
 *   await musicVersionRepository.findResolutionsByVersionId(7)
 * ```
 */
export type MusicResolutionDB = typeof musicResolution.$inferSelect

/**
 * Selected music version row shape from the `musicVersion` table.
 *
 * @remarks Groups alternate cuts of a track; each version owns one or more resolutions.
 * @see {@link musicVersionRepository.findVersionsByMusicId} for loading versions
 * @example
 * ```typescript
 * const versions: MusicVersionDB[] =
 *   await musicVersionRepository.findVersionsByMusicId(42)
 * ```
 */
export type MusicVersionDB = typeof musicVersion.$inferSelect

/**
 * Selected artist row shape used in music relations.
 *
 * @remarks Returned by {@link musicRelationRepository.findArtistsByMusicId} after joining
 * `musicArtist` with `artist`.
 * @see {@link MusicArtist} for the API-facing subset
 * @example
 * ```typescript
 * const artists: MusicArtistDB[] =
 *   await musicRelationRepository.findArtistsByMusicId(42)
 * ```
 */
export type MusicArtistDB = typeof artist.$inferSelect

/**
 * Selected music-to-artist relation row shape from the `musicArtist` table.
 *
 * @remarks Represents the join between a music record and an artist record.
 * @see {@link musicRelationRepository} for relation queries
 * @example
 * ```typescript
 * const relation: MusicArtistRelationDB = { musicId: 42, artistId: 10 }
 * ```
 */
export type MusicArtistRelationDB = typeof musicArtist.$inferSelect

/**
 * Theme row linked to an anime (`anime_music` + `music` projection).
 *
 * @remarks Used by the anime detail payload. `sequence` is the theme number
 * published by MAL (`1` = OP1/ED1) and `episodes` the range the theme covers
 * (`1-30`); both come from the link table, so the same track reused in a sequel
 * can carry a different range. They are `null` for sources that do not publish
 * them (AnimeThemes entries ingested before the metadata pass).
 * @see {@link animeMusicRepository.findMusicByAnimeId}
 * @example
 * ```typescript
 * const themes: AnimeThemeDB[] =
 *   await animeMusicRepository.findMusicByAnimeId(1735)
 * // [{ id: 2888, title: 'Nagareboshi ~Shooting Star~', type: 'ED', sequence: 1, episodes: '1-18' }]
 * ```
 */
export type AnimeThemeDB = {
  id: number
  title: string | null
  type: string
  sequence: number | null
  episodes: string | null
}

/**
 * Store link row of a music track (`music_stream` projection).
 *
 * @remarks One row per licensed store (Spotify, Apple Music, Amazon Music) with
 * the track id inside that store. It is the fallback when the catalog has no
 * playable file for the track.
 * @see {@link musicStreamRepository.findStreamsByMusicId}
 * @example
 * ```typescript
 * const streams: MusicStreamDB[] = await musicStreamRepository.findStreamsByMusicId(42)
 * // [{ provider: 'spotify', url: 'https://open.spotify.com/track/7weHG…', externalId: '7weHG…' }]
 * ```
 */
export type MusicStreamDB = {
  id: number
  musicId: number
  provider: string
  url: string
  externalId: string | null
  country: string | null
}
