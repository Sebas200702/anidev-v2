/**
 * Zod schemas for the people API (`/api/people`).
 *
 * @module domains/people/schemas/person-schema
 */
import { z } from 'zod'
import { PEOPLE_MEDIA } from '@people/constants'
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

const workSchema = z.object({
  malId: z.number(),
  title: z.string(),
  imageUrl: mediaUrlSchema,
})

/** A person in search results. */
export const personCardSchema = z.object({
  malId: z.number(),
  name: z.string(),
  imageUrl: mediaUrlSchema,
  favorites: z.number().nullable(),
})

/** Person profile with the size of each credit list. */
export const personProfileSchema = personCardSchema.extend({
  givenName: z.string().nullable(),
  familyName: z.string().nullable(),
  birthday: z.string().nullable(),
  gender: z.string().nullable(),
  about: z.string().nullable(),
  counts: z.object({
    voices: z.number(),
    animeCredits: z.number(),
    mangaCredits: z.number(),
    music: z.number(),
  }),
})

/** A character the person voices, with up to 3 of its anime. */
export const personVoiceSchema = z.object({
  character: z.object({
    malId: z.number(),
    name: z.string(),
    imageUrl: mediaUrlSchema,
  }),
  language: z.string(),
  anime: z.array(workSchema),
})

/** A work the person is credited on, with every position held. */
export const personCreditSchema = workSchema.extend({
  medium: z.enum(PEOPLE_MEDIA),
  positions: z.array(z.string()),
})

/** **Request** — `GET /api/people`. */
export const personSearchRequestSchema = peopleRequest(
  noParams,
  peopleSearchQuerySchema
)

/** **Request** — `GET /api/people/:malId`. */
export const getPersonSchema = peopleRequest(malIdParamsSchema, noQuery)

/** **Request** — `GET /api/people/:malId/voices`. */
export const personVoicesRequestSchema = peopleRequest(
  malIdParamsSchema,
  z.object({
    ...peoplePagination,
    language: z.string().trim().min(1).max(40).optional(),
  })
)

/** **Request** — `GET /api/people/:malId/credits`. */
export const personCreditsRequestSchema = peopleRequest(
  malIdParamsSchema,
  z.object({
    ...peoplePagination,
    medium: z.enum(PEOPLE_MEDIA).default('anime'),
  })
)

/** **Request** — `GET /api/people/:malId/music`. */
export const personMusicRequestSchema = peopleRequest(
  malIdParamsSchema,
  z.object(peoplePagination)
)

/** **Responses.** */
export const personSearchResponseSchema = createApiResponseSchema(
  z.array(personCardSchema)
)
export const personProfileResponseSchema =
  createApiResponseSchema(personProfileSchema)
export const personVoicesResponseSchema = createApiResponseSchema(
  z.array(personVoiceSchema)
)
export const personCreditsResponseSchema = createApiResponseSchema(
  z.array(personCreditSchema)
)
