import { db } from '@/core/db/client'
import { profile } from '@/core/db/schemas/profile'
import { dbError } from '@/core/errors/db-errors'
import type { UserProfileDB } from '@/domains/user/types/user-db'
import { eq } from 'drizzle-orm'

export const userRepository = {
  async getUserProfileById(userId: string): Promise<UserProfileDB> {
    try {
      const [result] = await db
        .select()
        .from(profile)
        .where(eq(profile.id, userId))
        
      return result
    } catch (error) {
      throw dbError('[GET_USER_PROFILE]', { userId }, error)
    }
  },
}
