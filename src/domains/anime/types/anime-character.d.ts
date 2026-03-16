import {
  voiceActorSchema,
  animeCharacterSchema,
  getAnimeCharacterSchema,
  animeCharacterResponseSchema,
} from '@/domains/anime/schemas/anime-character'

import { z } from 'zod'

export type VoiceActor = z.infer<typeof voiceActorSchema>
export type AnimeCharacter = z.infer<typeof animeCharacterSchema>
export type GetAnimeCharacter = z.infer<typeof getAnimeCharacterSchema>
export type AnimeCharacterResponse = z.infer<
  typeof animeCharacterResponseSchema
>
