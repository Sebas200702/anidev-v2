import type { MusicDB } from '@/domains/music/types/music-db'
import type { AnimeMusic } from '@/domains/anime/types/anime-full'
import { config } from '@/config'
import { normalizeString } from '@/core/utils/string/normalize'

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
