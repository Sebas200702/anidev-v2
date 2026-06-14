/**
 * Public exports for anime domain Zod schemas.
 *
 * @module domains/anime/schemas
 * @remarks
 * Request schemas (params/query) and response DTO validators. Types in
 * `domains/anime/types` are inferred from these schemas where applicable.
 */

export { animeCardSchema } from './anime-card-schema'
export { voiceActorSchema, animeCharacterSchema, getAnimeCharacterSchema, animeCharacterResponseSchema } from './anime-character-schema'
export { animeDetailsSchema, getAnimeDetailsSchema, animeDetailsResponseSchema } from './anime-details-schema'
export {
  animeMediaSchema,
  animeRelationsSchema,
  animeTitleSchema,
  animeGenreSchema,
  animeMusicSchema,
  animeExternalIdsSchema,
  animeFullDetailsSchema,
  animeFullDetailsResponseSchema,
  getAnimeFullSchema,
} from './anime-full-schema'
export { animeFiltersParamsSchema, animeFiltersSchema, animeListRequestSchema, animeListResponseSchema } from './anime-list-schema'
export { personSchema, animeStaffSchema, getAnimeStaffSchema, animeStaffResponseSchema } from './anime-staff-schema'
