/**
 * Zod schemas for the character API (`/api/characters`).
 *
 * @module domains/people/schemas/character-schema
 */
import { z } from 'zod'
import { CAST_ROLES, PEOPLE_MEDIA } from '@people/constants'
import { mediaUrlSchema } from '@media/schemas'
import { createApiResponseSchema } from '@shared/schemas/api-schema'
import {
  malIdParamsSchema,
  noParams,
  noQuery,
  peoplePagination,
  peopleRequest,
  peopleSearchQuerySchema,
} from './people-common-schema'

/** A character in search results. */
export const characterCardSchema = z.object({
  malId: z.number(),
  name: z.string(),
  nameKanji: z.string().nullable(),
  imageUrl: mediaUrlSchema,
  favorites: z.number().nullable(),
})

/** Character profile with its voice actors grouped by language. */
export const characterProfileSchema = characterCardSchema.extend({
  about: z.string().nullable(),
  gender: z.string().nullable(),
  dateOfBirth: z.string().nullable(),
  bloodType: z.string().nullable(),
  height: z.number().nullable(),
  weight: z.number().nullable(),
  age: z.string().nullable(),
  voiceActors: z.array(
    z.object({
      language: z.string(),
      actors: z.array(
        z.object({
          staffId: z.number(),
          name: z.string(),
          imageUrl: mediaUrlSchema,
        })
      ),
    })
  ),
})

/** A work where the character appears. */
export const characterAppearanceSchema = z.object({
  medium: z.enum(PEOPLE_MEDIA),
  malId: z.number(),
  title: z.string(),
  role: z.enum(CAST_ROLES),
  imageUrl: mediaUrlSchema,
})

/** **Request** — `GET /api/characters`. */
export const characterSearchRequestSchema = peopleRequest(
  noParams,
  peopleSearchQuerySchema
)

/** **Request** — `GET /api/characters/:malId`. */
export const getCharacterSchema = peopleRequest(malIdParamsSchema, noQuery)

/** **Request** — `GET /api/characters/:malId/appearances`. */
export const characterAppearancesRequestSchema = peopleRequest(
  malIdParamsSchema,
  z.object(peoplePagination)
)

/** **Responses.** */
export const characterSearchResponseSchema = createApiResponseSchema(
  z.array(characterCardSchema)
)
export const characterProfileResponseSchema = createApiResponseSchema(
  characterProfileSchema
)
export const characterAppearancesResponseSchema = createApiResponseSchema(
  z.array(characterAppearanceSchema)
)
