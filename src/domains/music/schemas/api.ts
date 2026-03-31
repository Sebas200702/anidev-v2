import { z } from 'zod'
import { createApiResponseSchema } from '@/core/http/schemas/api-response'
import { musicDetailsSchema } from '@/domains/music/schemas/music-details'
export const getMusicSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
})

export const musicDetailsResponseSchema =
  createApiResponseSchema(musicDetailsSchema)
