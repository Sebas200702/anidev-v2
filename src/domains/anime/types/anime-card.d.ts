import { z } from 'zod'
import { animeCardSchema } from '@/domains/anime/schemas/anime-card'

export type AnimeCard = z.infer<typeof animeCardSchema>
