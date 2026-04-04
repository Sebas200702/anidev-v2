import { z } from 'zod'

export const imageProxyRequestSchema = z.object({
  params: z.object({}).optional().default({}),
  query: z
    .object({
      url: z.url(),
      w: z.coerce.number().int().positive().optional(),
      q: z.coerce.number().int().min(1).max(100).optional(),
      fm: z.enum(['avif', 'webp']).optional(),
      format: z.enum(['avif', 'webp']).optional(),
    })
    .optional()
    .default({
      url: '',
    }),
  body: z.unknown().optional(),
})
