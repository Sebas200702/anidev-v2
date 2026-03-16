import { z } from 'zod'

export const animeCardSchema = z.object({
  malId: z.number(),
  title: z.string(),
  year: z.number(),
  status: z.string(),
  genres: z.array(z.string()),
  imageUrl: z.url(),
  smallImageUrl: z.url(),
  altText: z.string(),
})
