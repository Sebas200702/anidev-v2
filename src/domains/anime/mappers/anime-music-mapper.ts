/**
 * Maps music database rows into anime theme payloads.
 *
 * @module domains/anime/mappers/anime-music-mapper
 */
import type { MusicDB } from '@domains/music/types/music-db-types'
import type { AnimeMusic } from '@domains/anime/types'
import { config } from '@/config'
import { normalizeString } from '@utils/string/normalize-string-util'

/**
 * Maps music rows into opening and ending theme payloads.
 *
 * @param musicList - Music rows linked to an anime (already filtered OP/ED by caller)
 * @returns {@link AnimeMusic}[] with 1-based `order` and site URLs
 *
 * @remarks
 * **Type mapping:** DB `OP` → `'opening'`, `ED` → `'ending'`.
 *
 * **Edge cases:**
 * - Missing title → `'Unknown Title'` for display and slug base
 * - `order` is index + 1 in the filtered array (not DB sequence)
 *
 * @see {@link mapAnimeToFullDetails}
 * @see {@link animeMusicSchema}
 */
export function mapMusicListToAnimeMusic(musicList: MusicDB[]): AnimeMusic[] {
  return musicList.map((m, index) => {
    const type: AnimeMusic['type'] = m.type === 'ED' ? 'ending' : 'opening'
    const slug = normalizeString({
      string: m.title || `Unknown Title`,
      separator: '-',
    })

    const url = `${config.baseUrl}/music/${m.id}/${slug}`

    return {
      order: index + 1,
      title: m.title ?? 'Unknown Title',
      type,
      url,
    }
  })
}
