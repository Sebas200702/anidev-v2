import { z } from 'zod'
import {
  musicArtistSchema,
  musicDetailsSchema,
  musicResolutionSchema,
  musicVersionSchema,
} from '@/domains/music/schemas/music-details'

export type MusicDetails = z.infer<typeof musicDetailsSchema>
export type MusicArtist = z.infer<typeof musicArtistSchema>
export type MusicResolution = z.infer<typeof musicResolutionSchema>
export type MusicVersion = z.infer<typeof musicVersionSchema>
