import {
  animeDetailsSchema,

} from '@/domains/anime/schemas/anime-details'
import { z } from 'zod'

export type AnimeDetails = z.infer<typeof animeDetailsSchema>
