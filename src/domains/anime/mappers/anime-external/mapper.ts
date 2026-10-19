/**
 * Maps external identifier database rows into API payloads.
 *
 * @module domains/anime/mappers/anime-external/mapper
 */
import type { AnimeExternalDB, AnimeExternalIds } from '@anime/types'

/**
 * Maps a single external IDs row into normalized platform identifiers.
 *
 * @param db - Row from `anime_external_ids` (may be `undefined` from repo)
 * @returns Array of `{ id, source }` entries for populated platforms only
 *
 * @remarks
 * **Sources emitted when present:**
 * - `animeThemes` — non-empty `animeThemesSlug` (string id)
 * - `kitsu` — `kitsuId !== null`
 * - `tvdb` — `tvdbId !== null`
 * - `anilist` — `anilistId !== null`
 * - `ann` — `annId !== null` (Anime News Network: la enciclopedia que publica
 *   los OP/ED con nº de tema, artista y rango de episodios)
 *
 * **Edge case:** `undefined` input yields `[]` (caller should pass row or omit).
 *
 * @see {@link mapAnimeToFullDetails}
 * @see {@link animeExternalIdsSchema}
 */
export const mapExternalIds = (
  db: AnimeExternalDB | undefined
): AnimeExternalIds[] => {
  const result: AnimeExternalIds[] = []

  // Repository returns `undefined` when an anime has no external-ids row; treat
  // that as "no external identifiers" rather than crashing the full-detail endpoint.
  if (!db) {
    return result
  }

  if (db.animeThemesSlug) {
    result.push({
      id: db.animeThemesSlug,
      source: 'animeThemes',
    })
  }

  if (db.kitsuId !== null) {
    result.push({
      id: db.kitsuId,
      source: 'kitsu',
    })
  }

  if (db.tvdbId !== null) {
    result.push({
      id: db.tvdbId,
      source: 'tvdb',
    })
  }

  if (typeof db.anilistId === 'number') {
    result.push({
      id: db.anilistId,
      source: 'anilist',
    })
  }

  if (typeof db.annId === 'number') {
    result.push({
      id: db.annId,
      source: 'ann',
    })
  }

  return result
}
