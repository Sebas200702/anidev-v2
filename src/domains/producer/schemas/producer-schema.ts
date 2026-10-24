/**
 * Zod schemas for the producer API (`/api/producers`).
 *
 * @module domains/producer/schemas/producer-schema
 */
import { z } from 'zod'
import { ANIME_PRODUCER_ROLES } from '@anime/constants'
import { PRODUCER_ROLES, producerSortFields } from '@producer/constants'
import { createApiResponseSchema } from '@shared/schemas/api-schema'

const pagination = {
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}

const malIdParams = z.object({ malId: z.coerce.number().int().positive() })

/**
 * **Request query** — `GET /api/producers`.
 *
 * @remarks
 * | Field | Validation |
 * |-------|------------|
 * | `page` / `limit` | 1–10000 / 1–100 (default 20) |
 * | `query` | trimmed, 1–100 chars, matched against every title |
 * | `role` | `studio \| producer \| licensor \| serialization` |
 * | `sort` | `works` (default, desc) \| `name` (asc) |
 */
export const producerListQuerySchema = z.object({
  ...pagination,
  query: z.string().trim().min(1).max(100).optional(),
  role: z.enum(PRODUCER_ROLES).optional(),
  sort: z.enum(producerSortFields).default('works'),
})

/** **Request schema** — `GET /api/producers`. */
export const producerListRequestSchema = z.object({
  params: z.object({}).optional().default({}),
  query: producerListQuerySchema,
  body: z.unknown().optional(),
})

/** **Request schema** — `GET /api/producers/:malId`. */
export const getProducerSchema = z.object({
  params: malIdParams,
  query: z.object({}).optional().default({}),
  body: z.unknown().optional(),
})

/** **Request schema** — `GET /api/producers/:malId/anime`. */
export const producerAnimeRequestSchema = z.object({
  params: malIdParams,
  query: z.object({
    ...pagination,
    role: z.enum(ANIME_PRODUCER_ROLES).optional(),
  }),
  body: z.unknown().optional(),
})

/** **Request schema** — `GET /api/producers/:malId/manga`. */
export const producerMangaRequestSchema = z.object({
  params: malIdParams,
  query: z.object(pagination),
  body: z.unknown().optional(),
})

/** A producer in the list: id, display name and credited works. */
export const producerCardSchema = z.object({
  malId: z.number(),
  name: z.string(),
  works: z.number(),
})

/** Producer detail with every title and the credit count per role. */
export const producerDetailsSchema = z.object({
  malId: z.number(),
  name: z.string(),
  titles: z.array(z.object({ title: z.string(), type: z.string() })),
  established: z.string().nullable(),
  about: z.string().nullable(),
  counts: z.object({
    studio: z.number(),
    producer: z.number(),
    licensor: z.number(),
    serialization: z.number(),
  }),
})

/** **Response schema** — `{ data: ProducerCard[] }`. */
export const producerListResponseSchema = createApiResponseSchema(
  z.array(producerCardSchema)
)

/** **Response schema** — `{ data: ProducerDetails }`. */
export const producerDetailsResponseSchema = createApiResponseSchema(
  producerDetailsSchema
)
