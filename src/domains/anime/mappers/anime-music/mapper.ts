/**
 * Maps music database rows into anime theme payloads.
 *
 * @module domains/anime/mappers/anime-music/mapper
 */
import type { AnimeThemeDB } from '@music/types/music-db-types'
import type { AnimeMusic } from '@anime/types'
import { config } from '@/config'
import { normalizeString } from '@utils/string/normalize-string-util'

/**
 * Maps music rows into opening and ending theme payloads.
 *
 * @param musicList - Music rows linked to an anime (already filtered OP/ED by caller)
 * @returns {@link AnimeMusic}[] with the theme `order` and site URLs
 *
 * @remarks
 * **Type mapping:** DB `OP` → `'opening'`, `ED` → `'ending'`.
 *
 * **Edge cases:**
 * - Missing title → `'Unknown Title'` for display and slug base
 * - `order` uses the real theme number (`anime_music.sequence`, published by
 *   MAL) when present; only falls back to the array index for rows without it.
 *
 * @see {@link mapAnimeToFullDetails}
 * @see {@link animeMusicSchema}
 */
export const mapMusicListToAnimeMusic = (
  musicList: AnimeThemeDB[]
): AnimeMusic[] => {
  return musicList.map((m, index) => {
    const type: AnimeMusic['type'] = m.type === 'ED' ? 'ending' : 'opening'
    const slug = normalizeString({
      string: m.title || `Unknown Title`,
      separator: '-',
    })

    const url = `${config.baseUrl}/music/${m.id}/${slug}`

    return {
      order: m.sequence ?? index + 1,
      title: m.title ?? 'Unknown Title',
      type,
      episodes: m.episodes,
      url,
    }
  })
}
