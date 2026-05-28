/**
 * Domain types for anime character payloads.
 *
 * @module domains/anime/types/anime-character
 */
import {
  voiceActorSchema,
  animeCharacterSchema,
  getAnimeCharacterSchema,
  animeCharacterResponseSchema,
} from '@domains/anime/schemas/anime-character-schema'
import { z } from 'zod'

/**
 * Voice actor credited on a character entry.
 *
 * @see {@link personSchema} for nested person shape
 */
export type VoiceActor = z.infer<typeof voiceActorSchema>

/**
 * Character entry shown on an anime detail page.
 *
 * @see {@link mapAnimeCharacters}
 * @see {@link animeCharacterService.getAnimeCharacters}
 */
export type AnimeCharacter = z.infer<typeof animeCharacterSchema>

/**
 * Validated request shape for anime character endpoints.
 */
export type GetAnimeCharacter = z.infer<typeof getAnimeCharacterSchema>

/**
 * API response wrapping an anime character array.
 */
export type AnimeCharacterResponse = z.infer<
  typeof animeCharacterResponseSchema
>
