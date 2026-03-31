import { z } from 'zod'
import { createApiResponseSchema } from '@/core/http/schemas/api-response'

export const fanaticLevelSchema = z.enum(['low', 'medium', 'high']).optional()

export const frequencySchema = z.enum(['daily', 'weekly', 'monthly']).optional()

export const preferencesSchema = z.object({
  fanaticLevel: fanaticLevelSchema,
  frequency: frequencySchema,
  preferredFormat: z.string().optional(),
  favoriteGenres: z.array(z.number()).optional(),
  favoriteStudios: z.array(z.number()).optional(),
  favoriteAnimes: z.array(z.number()).optional(),
})

export const historySchema = z.object({
  watchedAnimes: z.array(z.number()).optional(),
})

export const userProfileSchema = z.object({
  id: z.string(),
  avatar: z.url().optional(),
  name: z.string().min(1),
  lastName: z.string().min(1),
  birthday: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']),
  preferences: preferencesSchema.optional(),
  history: historySchema.optional(),
})

export const userProfileResponseSchema =
  createApiResponseSchema(userProfileSchema)

export const getUserProfileSchema = z.object({
  params: z.object({
    userId: z.coerce.string(),
  }),
  query: z.object({}).optional().default({}),
  body: z.unknown().optional(),
})
