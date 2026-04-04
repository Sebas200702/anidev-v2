import { z } from 'zod'

export const mediaRequestSchema = z.object({
  params: z.object({
    path: z.string().min(1),
  }),
  query: z
    .object({
      w: z.coerce.number().int().positive().optional(),
      q: z.coerce.number().int().min(1).max(100).optional(),
      source: z
        .enum(['myanimelist', 'anilist', 'kitsu', 'thetvdb', 'custom', 'youtube'])
        .optional(),
    })
    .optional()
    .default({}),
  body: z.unknown().optional(),
})
