import { music, musicResolution, musicVersion } from '@/core/db/schemas/music'
import { InferModel } from 'drizzle-orm'
import { artist } from '@/core/db/schemas/artist'
import { musicArtist } from '@/core/db/schemas/music-relations'

export type MusicDB = InferModel<typeof music>
export type MusicResolutionDB = InferModel<typeof musicResolution>
export type MusicVersionDB = InferModel<typeof musicVersion>
export type MusicArtistDB = InferModel<typeof artist>
export type MusicArtistRelationDB = InferModel<typeof musicArtist>
