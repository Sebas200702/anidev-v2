/**
 * Maps database music rows into card payloads for list views.
 *
 * @module domains/music/mappers/music-card-mapper
 */
import type { MusicCard } from '@music/types/music-card-types'
import type {
  MapMusicCardInput,
  MapMusicListToCardsInput,
} from './music-card-mapper-types'

/**
 * Maps a single music database row into a {@link MusicCard}.
 *
 * @param input - Music row plus linked artists
 * @returns Compact card with type labels and artist credits
 *
 * @remarks
 * - `type` / `typeCode` normalize DB codes (`OP`, `ED`, `UNK`)
 * - Missing titles default to `'Unknown Title'`
 *
 * @see {@link musicCardSchema}
 */
export const mapMusicCard = ({
  music,
  artists,
}: MapMusicCardInput): MusicCard => {
  const typeCode: MusicCard['typeCode'] =
    music.type === 'OP' || music.type === 'ED' || music.type === 'UNK'
      ? music.type
      : 'UNK'

  let type: MusicCard['type'] = 'unknown'
  if (typeCode === 'OP') type = 'opening'
  else if (typeCode === 'ED') type = 'ending'

  return {
    id: music.id,
    title: music.title ?? 'Unknown Title',
    type,
    typeCode,
    artists: artists.map((a) => ({
      name: a.name ?? 'Unknown Artist',
      malId: a.malId ?? 0,
    })),
  }
}

/**
 * Maps a collection of music rows into card payloads.
 *
 * @param input - Music rows for one list page and artists grouped by music ID
 * @returns {@link MusicCard}[] in repository order
 *
 * @see {@link musicListService}
 */
export const mapMusicListToCards = ({
  musicList,
  artistsByMusicId,
}: MapMusicListToCardsInput): MusicCard[] => {
  return musicList.map((music) =>
    mapMusicCard({
      music,
      artists: artistsByMusicId[music.id] ?? [],
    })
  )
}
