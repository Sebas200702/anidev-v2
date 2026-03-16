import {
  animeExternalIdsSchema,
  animeGenreSchema,
  animeMediaSchema,
  animeRelationsSchema,
  animeTitleSchema,
  animeMusicSchema,
  animeFullDetailsSchema,
  animeFullDetailsResponseSchema,
} from '@/domains/anime/schemas/anime-full'
import { z } from 'zod'

export type AnimeFullDetails = z.infer<typeof animeFullDetailsSchema>
export type AnimeRelations = z.infer<typeof animeRelationsSchema>
export type AnimeTitle = z.infer<typeof animeTitleSchema>
export type AnimeGenre = z.infer<typeof animeGenreSchema>
export type AnimeMedia = z.infer<typeof animeMediaSchema>
export type AnimeMusic = z.infer<typeof animeMusicSchema>
export type AnimeExternalIds = z.infer<typeof animeExternalIdsSchema>
export type AnimeFullDetailsResponse = z.infer<
  typeof animeFullDetailsResponseSchema
>
