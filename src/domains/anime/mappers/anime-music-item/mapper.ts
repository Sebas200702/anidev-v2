/**
 * Maps an anime's music rows into addressable theme items.
 *
 * @module domains/anime/mappers/anime-music-item/mapper
 */
import { mapMusicListToAnimeMusic } from '@anime/mappers/anime-music'
import type { AnimeMusicItem } from '@anime/types'
import type { AnimeThemeDB } from '@music/types/music-db-types'

const THEME_TYPES = ['OP', 'ED'] as const

/**
 * Maps music rows into opening/ending items carrying the music `id`.
 *
 * @param musicList - Rows linked to an anime, in repository order
 * @returns {@link AnimeMusicItem}[] in repository order, OP/ED only
 *
 * @remarks
 * Each type is mapped as its own group through {@link mapMusicListToAnimeMusic},
 * exactly like `/full`, so `order`, `title` and `url` match that payload; other
 * track types (insert songs, …) are dropped.
 *
 * @see {@link animeMusicItemSchema}
 */
export const mapAnimeMusicItems = (
  musicList: AnimeThemeDB[]
): AnimeMusicItem[] => {
  const byId = new Map<number, AnimeMusicItem>()

  for (const themeType of THEME_TYPES) {
    const group = musicList.filter(({ type }) => type === themeType)
    mapMusicListToAnimeMusic(group).forEach((theme, index) => {
      const { id } = group[index]
      byId.set(id, { id, ...theme })
    })
  }

  return musicList.flatMap(({ id }) => byId.get(id) ?? [])
}
