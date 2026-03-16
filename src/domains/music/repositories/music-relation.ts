import { db } from '@/core/db/client'
import { musicArtist } from '@/core/db/schemas/music-relations'
import { artist } from '@/core/db/schemas/artist'
import { eq } from 'drizzle-orm'
import type { MusicArtistDB } from '@/domains/music/types/music-db'

export const musicRelationRepository = {
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
}
