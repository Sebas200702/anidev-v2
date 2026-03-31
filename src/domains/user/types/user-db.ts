import { profile } from '@/core/db/schemas/profile'
import type { InferSelectModel , InferInsertModel } from 'drizzle-orm'


export type UserProfileDB = InferSelectModel<typeof profile>
export type NewUserProfileDB = InferInsertModel<typeof profile>
