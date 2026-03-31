import {
  userProfileSchema,
  preferencesSchema,
  historySchema,
  frequencySchema,
  fanaticLevelSchema,
} from '@/domains/user/schemas/user'
import { z } from 'zod'

export type UserProfile = z.infer<typeof userProfileSchema>
export type UserPreferences = z.infer<typeof preferencesSchema>
export type UserHistory = z.infer<typeof historySchema>
export type UserFrequency = z.infer<typeof frequencySchema>
export type UserFanaticLevel = z.infer<typeof fanaticLevelSchema>
