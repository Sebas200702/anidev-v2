import { z } from 'zod'

export const musicArtistSchema = z.object({
  name: z.string(),
  malId: z.number(),
})
export const musicResolutionSchema = z.object({
  resolution: z.string(),
  audioUrl: z.string(),
  videoUrl: z.string(),
  songId: z.number(),
})
export const musicVersionSchema = z.object({
  musicId: z.number(),
  version: z.number(),
  versionId: z.number(),
  resolutions: z.array(musicResolutionSchema),
})
export const musicDetailsSchema = z.object({
  title: z.string(),
  type: z.enum(['opening', 'ending', 'unknown']),
  typeCode: z.enum(['OP', 'ED', 'UNK']),
  versions: z.array(musicVersionSchema),
  artist: z.array(musicArtistSchema),
})


