import { z } from 'zod'

export const animeCardSchema = z.object({
  malId: z.number(),
  title: z.string(),
  year: z.number(),
  status: z.string(),
  score: z.number().nullable(),
  type: z.string(),
  imageUrl: z.url(),
  smallImageUrl: z.url(),
  altImageText: z.string(),
})
