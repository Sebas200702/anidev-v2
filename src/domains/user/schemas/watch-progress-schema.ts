import { z } from 'zod'
import { createApiResponseSchema } from '@shared/schemas/api-schema'

export const watchProgressEntrySchema = z.object({
  animeId: z.number().int().positive(),
  episodeId: z.number().int().positive(),
  episodeNumber: z.number().int().positive().optional(),
  progressSeconds: z.number().int().min(0),
  durationSeconds: z.number().int().min(0).optional(),
})

export const getWatchProgressRequestSchema = z.object({
  params: z.object({}).optional().default({}),
  query: z
    .object({ animeId: z.coerce.number().int().positive().optional() })
    .optional()
    .default({}),
  body: z.unknown().optional(),
})

export const putWatchProgressRequestSchema = z.object({
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({}),
  body: watchProgressEntrySchema,
})

export const watchProgressResponseSchema = createApiResponseSchema(
  z.array(
    z.object({
      animeId: z.number(),
      episodeId: z.number().nullable(),
      progressSeconds: z.number(),
      durationSeconds: z.number().nullable(),
      completed: z.boolean(),
      updatedAt: z.string(),
    })
  )
)

export const watchProgressMutationResponseSchema = createApiResponseSchema(
  z.object({
    animeId: z.number(),
    episodeId: z.number().nullable(),
    episodeNumber: z.number().nullable().optional(),
    progressSeconds: z.number(),
    durationSeconds: z.number().nullable(),
    completed: z.boolean(),
    watchedAt: z.string().optional(),
    updatedAt: z.string(),
  })
)

export type WatchProgressEntry = z.infer<typeof watchProgressEntrySchema>
