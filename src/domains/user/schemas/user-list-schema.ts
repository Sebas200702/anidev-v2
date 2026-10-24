/**
 * Zod schemas for the relational user anime list API.
 *
 * @module domains/user/schemas/user-list-schema
 */
import { z } from 'zod'
import { createApiResponseSchema } from '@shared/schemas/api-schema'

export const userListStatusSchema = z.enum([
  'watching',
  'completed',
  'plan_to_watch',
  'on_hold',
  'dropped',
])

export const userListEntrySchema = z.object({
  animeId: z.number().int().positive(),
  status: userListStatusSchema.default('plan_to_watch'),
  isFavorite: z.boolean().default(false),
  score: z.number().min(1).max(10).nullable().optional(),
})

export const userListRequestSchema = z.object({
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
  body: userListEntrySchema,
})

export const userListDeleteRequestSchema = z.object({
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
  body: z.object({ animeId: z.number().int().positive() }),
})

export const getUserListRequestSchema = z.object({
  params: z.object({}).optional().default({}),
  query: z
    .object({
      status: userListStatusSchema.optional(),
      isFavorite: z.coerce.boolean().optional(),
    })
    .optional()
    .default({}),
  body: z.unknown().optional(),
})

export const userListResponseSchema = z.object({
  data: z.array(
    z.object({
      animeId: z.number(),
      status: userListStatusSchema,
      isFavorite: z.boolean(),
      score: z.number().nullable(),
      addedAt: z.string(),
      updatedAt: z.string(),
    })
  ),
  status: z.number(),
  meta: z.object({ count: z.number() }).optional(),
})

export const userListMutationResponseSchema = createApiResponseSchema(
  z.object({
    animeId: z.number(),
    status: userListStatusSchema,
    isFavorite: z.boolean(),
    score: z.number().nullable(),
    addedAt: z.string(),
    updatedAt: z.string(),
  })
)

export const userListDeleteResponseSchema = createApiResponseSchema(
  z.object({ removed: z.boolean() })
)

export type UserListEntry = z.infer<typeof userListEntrySchema>
export type UserListStatus = z.infer<typeof userListStatusSchema>
